import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Product from '../models/Product.js'
import { resolveSiteId } from '../utils/siteId.js'
import { logActivity } from '../utils/activityLog.js'

const router = Router()

function siteIdQuery(siteId) {
  // Eski kayıtlarda siteId büyük/küçük harf farklı yazılmış olabilir.
  // Bu yüzden sorguları case-insensitive tutuyoruz.
  const safe = String(siteId || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return { $regex: new RegExp(`^${safe}$`, 'i') }
}

function toResponse(doc) {
  if (!doc) return null
  const d = doc.toJSON ? doc.toJSON() : doc
  return { ...d, id: d.id || doc._id?.toString() }
}

router.get('/:siteId/products', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const products = await Product.find({ siteId: siteIdQuery(resolvedId) }).sort({ createdAt: -1 }).lean()
    const list = products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      price: p.price,
      description: p.description || '',
      image: p.image || '',
      status: p.status,
      filters: p.filters && typeof p.filters === 'object' ? p.filters : {},
      attachments: Array.isArray(p.attachments) ? p.attachments.map((a) => ({ name: a.name || '', url: a.url || '' })) : [],
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      hcpProfessionalGate: p.hcpProfessionalGate !== false,
      createdAt: p.createdAt?.toISOString?.(),
      updatedAt: p.updatedAt?.toISOString?.(),
    }))
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Ürünler yüklenemedi.' })
  }
})

router.post('/:siteId/products', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const { name, slug, price, description, image, status = 'aktif', filters, attachments, metaTitle, metaDescription, hcpProfessionalGate } = req.body || {}
    if (!name) return res.status(400).json({ error: 'Ürün adı zorunludur.' })
    const product = await Product.create({
      siteId: resolvedId,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      price: price || '',
      description: description || '',
      image: image || '',
      status,
      filters: filters && typeof filters === 'object' ? filters : {},
      attachments: Array.isArray(attachments) ? attachments.map((a) => ({ name: a.name || '', url: a.url || '' })) : [],
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      hcpProfessionalGate: hcpProfessionalGate !== false,
    })
    await logActivity({ type: 'product', action: 'create', siteId: resolvedId, targetId: product._id.toString(), label: `Ürün: ${name}` })
    res.status(201).json(toResponse(product))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Eklenemedi.' })
  }
})

router.put('/:siteId/products/:id', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const { id } = req.params
    const { name, slug, price, description, image, status, filters, attachments, metaTitle, metaDescription, hcpProfessionalGate } = req.body || {}
    const update = {}
    if (name != null) update.name = name
    if (slug != null) update.slug = slug
    if (price != null) update.price = price
    if (description != null) update.description = description
    if (image !== undefined) update.image = image || ''
    if (status != null) update.status = status
    if (filters !== undefined) update.filters = filters && typeof filters === 'object' ? filters : {}
    if (attachments !== undefined) update.attachments = Array.isArray(attachments) ? attachments.map((a) => ({ name: a.name || '', url: a.url || '' })) : []
    if (metaTitle !== undefined) update.metaTitle = metaTitle || ''
    if (metaDescription !== undefined) update.metaDescription = metaDescription || ''
    if (hcpProfessionalGate !== undefined) update.hcpProfessionalGate = !!hcpProfessionalGate
    const product = await Product.findOneAndUpdate({ _id: id, siteId: siteIdQuery(resolvedId) }, update, { new: true })
    if (!product) return res.status(404).json({ error: 'Ürün bulunamadı.' })
    await logActivity({ type: 'product', action: 'update', siteId: resolvedId, targetId: id, label: `Ürün: ${product.name}` })
    res.json(toResponse(product))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Güncellenemedi.' })
  }
})

router.delete('/:siteId/products/:id', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const { id } = req.params
    const product = await Product.findOne({ _id: id, siteId: siteIdQuery(resolvedId) }).select('name').lean()
    const result = await Product.deleteOne({ _id: id, siteId: siteIdQuery(resolvedId) })
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Ürün bulunamadı.' })
    await logActivity({ type: 'product', action: 'delete', siteId: resolvedId, targetId: id, label: product ? `Ürün silindi: ${product.name}` : 'Ürün silindi' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Silinemedi.' })
  }
})

export default router
