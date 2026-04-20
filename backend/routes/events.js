import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import SiteEvent from '../models/SiteEvent.js'
import { resolveSiteId } from '../utils/siteId.js'
import { logActivity } from '../utils/activityLog.js'

const router = Router()

function siteIdQuery(siteId) {
  const safe = String(siteId || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return { $regex: new RegExp(`^${safe}$`, 'i') }
}

function toResponse(doc) {
  if (!doc) return null
  const d = doc.toJSON ? doc.toJSON() : doc
  return { ...d, id: d.id || doc._id?.toString() }
}

function slugifyTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

router.get('/:siteId/events', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const list = await SiteEvent.find({ siteId: siteIdQuery(resolvedId) })
      .sort({ sortOrder: 1, eventDate: -1, createdAt: -1 })
      .lean()
    const mapped = list.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      slug: e.slug || '',
      description: e.description || '',
      eventDate: e.eventDate?.toISOString?.() || null,
      location: e.location || '',
      image: e.image || '',
      linkUrl: e.linkUrl || '',
      status: e.status,
      sortOrder: e.sortOrder ?? 0,
      createdAt: e.createdAt?.toISOString?.(),
      updatedAt: e.updatedAt?.toISOString?.(),
    }))
    res.json(mapped)
  } catch (err) {
    res.status(500).json({ error: 'Etkinlikler yüklenemedi.' })
  }
})

router.post('/:siteId/events', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const {
      title,
      slug,
      description,
      eventDate,
      location,
      image,
      linkUrl,
      status = 'aktif',
      sortOrder = 0,
    } = req.body || {}
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Başlık zorunludur.' })
    const slugTrim = slug != null ? String(slug).trim() : ''
    const titleSlug = slugifyTitle(title)
    const doc = await SiteEvent.create({
      siteId: resolvedId,
      title: String(title).trim(),
      slug: slugTrim || titleSlug || 'etkinlik',
      description: description ? String(description) : '',
      eventDate: eventDate ? new Date(eventDate) : null,
      location: location ? String(location) : '',
      image: image ? String(image) : '',
      linkUrl: linkUrl ? String(linkUrl) : '',
      status: status === 'pasif' ? 'pasif' : 'aktif',
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    })
    await logActivity({
      type: 'event',
      action: 'create',
      siteId: resolvedId,
      targetId: doc._id.toString(),
      label: `Etkinlik: ${title}`,
    })
    res.status(201).json(toResponse(doc))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Eklenemedi.' })
  }
})

router.put('/:siteId/events/:id', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const { id } = req.params
    const { title, slug, description, eventDate, location, image, linkUrl, status, sortOrder } = req.body || {}
    const update = {}
    if (title != null) update.title = String(title).trim()
    if (slug !== undefined) update.slug = String(slug || '').trim()
    if (description !== undefined) update.description = String(description)
    if (eventDate !== undefined) update.eventDate = eventDate ? new Date(eventDate) : null
    if (location !== undefined) update.location = String(location)
    if (image !== undefined) update.image = String(image)
    if (linkUrl !== undefined) update.linkUrl = String(linkUrl)
    if (status != null) update.status = status === 'pasif' ? 'pasif' : 'aktif'
    if (sortOrder !== undefined) update.sortOrder = Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0
    const doc = await SiteEvent.findOneAndUpdate({ _id: id, siteId: siteIdQuery(resolvedId) }, update, { new: true })
    if (!doc) return res.status(404).json({ error: 'Etkinlik bulunamadı.' })
    await logActivity({
      type: 'event',
      action: 'update',
      siteId: resolvedId,
      targetId: id,
      label: `Etkinlik: ${doc.title}`,
    })
    res.json(toResponse(doc))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Güncellenemedi.' })
  }
})

router.delete('/:siteId/events/:id', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const { id } = req.params
    const ev = await SiteEvent.findOne({ _id: id, siteId: siteIdQuery(resolvedId) }).select('title').lean()
    const result = await SiteEvent.deleteOne({ _id: id, siteId: siteIdQuery(resolvedId) })
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Etkinlik bulunamadı.' })
    await logActivity({
      type: 'event',
      action: 'delete',
      siteId: resolvedId,
      targetId: id,
      label: ev ? `Etkinlik silindi: ${ev.title}` : 'Etkinlik silindi',
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Silinemedi.' })
  }
})

export default router
