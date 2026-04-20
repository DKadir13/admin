import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import BlogPost from '../models/BlogPost.js'
import { resolveSiteId } from '../utils/siteId.js'
import { logActivity } from '../utils/activityLog.js'

const router = Router()

function toResponse(doc) {
  if (!doc) return null
  const d = doc.toJSON ? doc.toJSON() : doc
  return { ...d, id: d.id || doc._id?.toString() }
}

function isPostActive(p) {
  if (p.keepPermanent) return true
  if (!p.publishedAt) return false
  const pub = new Date(p.publishedAt).getTime()
  const days = (p.keepForDays ?? 30) * 24 * 60 * 60 * 1000
  return Date.now() <= pub + days
}

router.get('/:siteId/blog', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const { active } = req.query
    let posts = await BlogPost.find({ siteId: resolvedId }).sort({ createdAt: -1 }).lean()
    if (active === 'true') {
      posts = posts.filter(isPostActive)
    }
    const list = posts.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      content: p.content || '',
      image: p.image || '',
      status: p.status,
      publishedAt: p.publishedAt?.toISOString?.() || null,
      displayDates: (p.displayDates || []).map((d) => (d && d.toISOString ? d.toISOString() : d)).filter(Boolean),
      keepPermanent: !!p.keepPermanent,
      keepForDays: p.keepForDays ?? 30,
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      createdAt: p.createdAt?.toISOString?.(),
      updatedAt: p.updatedAt?.toISOString?.(),
    }))
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Yazılar yüklenemedi.' })
  }
})

router.post('/:siteId/blog', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const {
      title,
      slug,
      content,
      image,
      status = 'taslak',
      publishedAt,
      displayDates,
      keepPermanent = true,
      keepForDays = 30,
      metaTitle,
      metaDescription,
    } = req.body || {}
    if (!title) return res.status(400).json({ error: 'Başlık zorunludur.' })
    const dates = Array.isArray(displayDates) ? displayDates.map((d) => (d ? new Date(d) : null)).filter(Boolean) : []
    const primaryDate = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : (publishedAt ? new Date(publishedAt) : null)
    const post = await BlogPost.create({
      siteId: resolvedId,
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      content: content || '',
      image: image || '',
      status,
      publishedAt: primaryDate,
      displayDates: dates,
      keepPermanent: !!keepPermanent,
      keepForDays: keepPermanent ? 30 : Math.max(1, parseInt(keepForDays, 10) || 30),
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
    })
    await logActivity({ type: 'blog', action: 'create', siteId: resolvedId, targetId: post._id.toString(), label: `Yazı: ${title}` })
    res.status(201).json(toResponse(post))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Eklenemedi.' })
  }
})

router.put('/:siteId/blog/:id', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const { id } = req.params
    const { title, slug, content, image, status, publishedAt, displayDates, keepPermanent, keepForDays, metaTitle, metaDescription } = req.body || {}
    const update = {}
    if (title != null) update.title = title
    if (slug != null) update.slug = slug
    if (content != null) update.content = content
    if (image !== undefined) update.image = image || ''
    if (status != null) update.status = status
    if (metaTitle !== undefined) update.metaTitle = metaTitle || ''
    if (metaDescription !== undefined) update.metaDescription = metaDescription || ''
    if (displayDates !== undefined) {
      const dates = Array.isArray(displayDates) ? displayDates.map((d) => (d ? new Date(d) : null)).filter(Boolean) : []
      update.displayDates = dates
      update.publishedAt = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : (publishedAt ? new Date(publishedAt) : null)
    } else if (publishedAt !== undefined) {
      update.publishedAt = publishedAt ? new Date(publishedAt) : null
    }
    if (keepPermanent !== undefined) update.keepPermanent = !!keepPermanent
    if (keepForDays !== undefined) update.keepForDays = Math.max(1, parseInt(keepForDays, 10) || 30)
    const post = await BlogPost.findOneAndUpdate({ _id: id, siteId: resolvedId }, update, { new: true })
    if (!post) return res.status(404).json({ error: 'Yazı bulunamadı.' })
    await logActivity({ type: 'blog', action: 'update', siteId: resolvedId, targetId: id, label: `Yazı: ${post.title}` })
    res.json(toResponse(post))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Güncellenemedi.' })
  }
})

router.delete('/:siteId/blog/:id', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const { id } = req.params
    const post = await BlogPost.findOne({ _id: id, siteId: resolvedId }).select('title').lean()
    const result = await BlogPost.deleteOne({ _id: id, siteId: resolvedId })
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Yazı bulunamadı.' })
    await logActivity({ type: 'blog', action: 'delete', siteId: resolvedId, targetId: id, label: post ? `Yazı silindi: ${post.title}` : 'Yazı silindi' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Silinemedi.' })
  }
})

export default router
