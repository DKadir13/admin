import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import InternalNote from '../models/InternalNote.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { siteId } = req.query
    const filter = siteId !== undefined ? { siteId: siteId ? String(siteId) : '' } : {}
    const list = await InternalNote.find(filter).sort({ updatedAt: -1 }).limit(100).lean()
    res.json(list.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      content: n.content || '',
      siteId: n.siteId || '',
      createdAt: n.createdAt?.toISOString?.(),
      updatedAt: n.updatedAt?.toISOString?.(),
    })))
  } catch (err) {
    res.status(500).json({ error: 'Notlar alınamadı.' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, siteId } = req.body || {}
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Başlık zorunludur.' })
    const doc = await InternalNote.create({
      title: String(title).trim(),
      content: content ? String(content) : '',
      siteId: siteId ? String(siteId) : '',
    })
    res.status(201).json({
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content || '',
      siteId: doc.siteId || '',
      createdAt: doc.createdAt?.toISOString?.(),
      updatedAt: doc.updatedAt?.toISOString?.(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Eklenemedi.' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, siteId } = req.body || {}
    const update = {}
    if (title !== undefined) update.title = String(title).trim()
    if (content !== undefined) update.content = String(content)
    if (siteId !== undefined) update.siteId = siteId ? String(siteId) : ''
    const doc = await InternalNote.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!doc) return res.status(404).json({ error: 'Not bulunamadı.' })
    res.json({
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content || '',
      siteId: doc.siteId || '',
      createdAt: doc.createdAt?.toISOString?.(),
      updatedAt: doc.updatedAt?.toISOString?.(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Güncellenemedi.' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await InternalNote.findByIdAndDelete(req.params.id)
    if (!result) return res.status(404).json({ error: 'Not bulunamadı.' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Silinemedi.' })
  }
})

export default router
