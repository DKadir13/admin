import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Domain from '../models/Domain.js'

const router = Router()

function toResponse(doc) {
  if (!doc) return null
  const d = doc.toJSON ? doc.toJSON() : { ...doc }
  const id = d.id || doc._id?.toString()
  const out = { ...d, id, expiryDate: d.expiryDate?.toISOString?.() || null }
  delete out._id
  return out
}

/** Tüm alan adlarını listele */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await Domain.find().sort({ name: 1 }).lean()
    const result = list.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      siteId: d.siteId || '',
      expiryDate: d.expiryDate?.toISOString?.() || null,
      registrar: d.registrar || '',
      notes: d.notes || '',
      dnsRecords: d.dnsRecords || [],
      createdAt: d.createdAt?.toISOString?.(),
      updatedAt: d.updatedAt?.toISOString?.(),
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Alan adları yüklenemedi.' })
  }
})

/** Tek alan adı getir */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Domain.findById(req.params.id).lean()
    if (!doc) return res.status(404).json({ error: 'Alan adı bulunamadı.' })
    res.json(toResponse({ ...doc, _id: doc._id }))
  } catch (err) {
    res.status(500).json({ error: 'Alan adı getirilemedi.' })
  }
})

/** Yeni alan adı ekle */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, siteId, expiryDate, registrar, notes, dnsRecords } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Alan adı (name) zorunludur.' })
    }
    const doc = await Domain.create({
      name: String(name).trim(),
      siteId: siteId || '',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      registrar: registrar || '',
      notes: notes || '',
      dnsRecords: Array.isArray(dnsRecords)
        ? dnsRecords.filter((r) => r && (r.type || r.value)).map((r) => ({
            type: r.type || 'A',
            name: r.name || '',
            value: r.value || '',
            ttl: r.ttl != null ? Number(r.ttl) : 3600,
            priority: r.priority != null ? Number(r.priority) : null,
          }))
        : [],
    })
    res.status(201).json(toResponse(doc))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Alan adı eklenemedi.' })
  }
})

/** Alan adı güncelle */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, siteId, expiryDate, registrar, notes, dnsRecords } = req.body
    const doc = await Domain.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Alan adı bulunamadı.' })
    if (name != null) doc.name = String(name).trim()
    if (siteId !== undefined) doc.siteId = siteId || ''
    if (expiryDate !== undefined) doc.expiryDate = expiryDate ? new Date(expiryDate) : null
    if (registrar !== undefined) doc.registrar = registrar || ''
    if (notes !== undefined) doc.notes = notes || ''
    if (Array.isArray(dnsRecords)) {
      doc.dnsRecords = dnsRecords
        .filter((r) => r && (r.type || r.value))
        .map((r) => ({
          type: r.type || 'A',
          name: r.name || '',
          value: r.value || '',
          ttl: r.ttl != null ? Number(r.ttl) : 3600,
          priority: r.priority != null ? Number(r.priority) : null,
        }))
    }
    await doc.save()
    res.json(toResponse(doc))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Alan adı güncellenemedi.' })
  }
})

/** Alan adı sil */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Domain.findByIdAndDelete(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Alan adı bulunamadı.' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Alan adı silinemedi.' })
  }
})

export default router
