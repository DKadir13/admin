import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import QuickLink from '../models/QuickLink.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await QuickLink.find().sort({ order: 1, createdAt: 1 }).lean()
    res.json(list.map((l) => ({
      id: l._id.toString(),
      label: l.label,
      url: l.url,
      order: l.order ?? 0,
      createdAt: l.createdAt?.toISOString?.(),
    })))
  } catch (err) {
    res.status(500).json({ error: 'Linkler alınamadı.' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { label, url, order } = req.body || {}
    if (!label || !String(label).trim()) return res.status(400).json({ error: 'Etiket zorunludur.' })
    if (!url || !String(url).trim()) return res.status(400).json({ error: 'URL zorunludur.' })
    const doc = await QuickLink.create({
      label: String(label).trim(),
      url: String(url).trim(),
      order: typeof order === 'number' ? order : 0,
    })
    res.status(201).json({
      id: doc._id.toString(),
      label: doc.label,
      url: doc.url,
      order: doc.order ?? 0,
      createdAt: doc.createdAt?.toISOString?.(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Eklenemedi.' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { label, url, order } = req.body || {}
    const update = {}
    if (label !== undefined) update.label = String(label).trim()
    if (url !== undefined) update.url = String(url).trim()
    if (order !== undefined) update.order = typeof order === 'number' ? order : 0
    const doc = await QuickLink.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!doc) return res.status(404).json({ error: 'Link bulunamadı.' })
    res.json({
      id: doc._id.toString(),
      label: doc.label,
      url: doc.url,
      order: doc.order ?? 0,
      createdAt: doc.createdAt?.toISOString?.(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Güncellenemedi.' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await QuickLink.findByIdAndDelete(req.params.id)
    if (!result) return res.status(404).json({ error: 'Link bulunamadı.' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Silinemedi.' })
  }
})

export default router
