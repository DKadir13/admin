import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Product from '../models/Product.js'
import BlogPost from '../models/BlogPost.js'
import { resolveSiteId } from '../utils/siteId.js'

const router = Router()

function siteIdQuery(siteId) {
  const safe = String(siteId || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return { $regex: new RegExp(`^${safe}$`, 'i') }
}

router.get('/products', authMiddleware, async (req, res) => {
  try {
    const siteId = req.query.siteId
    if (!siteId) return res.status(400).json({ error: 'siteId gerekli.' })
    const resolvedId = await resolveSiteId(siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const list = await Product.find({ siteId: siteIdQuery(resolvedId) }).sort({ createdAt: -1 }).lean()
    const data = list.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      price: p.price,
      description: p.description || '',
      image: p.image || '',
      status: p.status,
      filters: p.filters || {},
      attachments: p.attachments || [],
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      hcpProfessionalGate: p.hcpProfessionalGate !== false,
      createdAt: p.createdAt?.toISOString?.(),
      updatedAt: p.updatedAt?.toISOString?.(),
    }))
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="urunler-${resolvedId}.json"`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Dışa aktarılamadı.' })
  }
})

router.get('/blog', authMiddleware, async (req, res) => {
  try {
    const siteId = req.query.siteId
    if (!siteId) return res.status(400).json({ error: 'siteId gerekli.' })
    const resolvedId = await resolveSiteId(siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const list = await BlogPost.find({ siteId: siteIdQuery(resolvedId) }).sort({ createdAt: -1 }).lean()
    const data = list.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      content: p.content || '',
      image: p.image || '',
      status: p.status,
      publishedAt: p.publishedAt?.toISOString?.(),
      displayDates: (p.displayDates || []).map((d) => (d instanceof Date ? d.toISOString() : d)),
      keepPermanent: p.keepPermanent,
      keepForDays: p.keepForDays,
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      createdAt: p.createdAt?.toISOString?.(),
      updatedAt: p.updatedAt?.toISOString?.(),
    }))
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="blog-${resolvedId}.json"`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Dışa aktarılamadı.' })
  }
})

export default router
