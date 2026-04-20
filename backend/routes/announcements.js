import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Announcement from '../models/Announcement.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { siteId } = req.query
    const filter = siteId ? { $or: [{ siteId: '' }, { siteId }] } : {}
    const list = await Announcement.find(filter).sort({ createdAt: -1 }).limit(50).lean()
    res.json(list.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      body: a.body || '',
      siteId: a.siteId || '',
      createdAt: a.createdAt?.toISOString?.(),
    })))
  } catch (err) {
    res.status(500).json({ error: 'Duyurular alınamadı.' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, body, siteId } = req.body || {}
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Başlık zorunludur.' })
    const doc = await Announcement.create({
      title: String(title).trim(),
      body: body ? String(body) : '',
      siteId: siteId ? String(siteId) : '',
    })
    res.status(201).json({
      id: doc._id.toString(),
      title: doc.title,
      body: doc.body || '',
      siteId: doc.siteId || '',
      createdAt: doc.createdAt?.toISOString?.(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Eklenemedi.' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, body, siteId } = req.body || {}
    const update = {}
    if (title !== undefined) update.title = String(title).trim()
    if (body !== undefined) update.body = String(body)
    if (siteId !== undefined) update.siteId = siteId ? String(siteId) : ''
    const doc = await Announcement.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!doc) return res.status(404).json({ error: 'Duyuru bulunamadı.' })
    res.json({
      id: doc._id.toString(),
      title: doc.title,
      body: doc.body || '',
      siteId: doc.siteId || '',
      createdAt: doc.createdAt?.toISOString?.(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Güncellenemedi.' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Announcement.findByIdAndDelete(req.params.id)
    if (!result) return res.status(404).json({ error: 'Duyuru bulunamadı.' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Silinemedi.' })
  }
})

export default router
