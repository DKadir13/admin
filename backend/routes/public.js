import { Router } from 'express'
import BlogPost from '../models/BlogPost.js'
import Product from '../models/Product.js'
import SiteEvent from '../models/SiteEvent.js'
import Site from '../models/Site.js'
import { resolveSiteId } from '../utils/siteId.js'

const router = Router()

/** İstekten API kök URL'ini alır (diğer sitede resimleri göstermek için tam URL) */
function getBaseUrl(req) {
  const envBase = process.env.PUBLIC_API_BASE || process.env.BACKEND_PUBLIC_URL
  if (envBase) return envBase.replace(/\/$/, '')
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https'
  const host = req.get('x-forwarded-host') || req.get('host') || ''
  return `${proto}://${host}`
}

/** Göreli resim yolunu tam URL yapar; diğer site doğrudan <img src={image} /> kullanabilsin */
function toAbsoluteImageUrl(baseUrl, imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return ''
  const trimmed = imagePath.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  const base = baseUrl.replace(/\/$/, '')
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${base}${path}`
}

function isPostActive(p) {
  if (p.keepPermanent) return true
  if (!p.publishedAt) return false
  const pub = new Date(p.publishedAt).getTime()
  const days = (p.keepForDays ?? 30) * 24 * 60 * 60 * 1000
  return Date.now() <= pub + days
}

function siteIdQuery(siteId) {
  const safe = String(siteId || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return { $regex: new RegExp(`^${safe}$`, 'i') }
}

/** Herkese açık: sadece yayında ve süresi dolmamış blog yazıları */
router.get('/sites/:siteId/blog', async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) {
      return res.json([])
    }
    const site = await Site.findOne({ id: resolvedId }).lean()
    if (site && !site.blogEnabled) {
      return res.json([])
    }
    const baseUrl = getBaseUrl(req)
    let posts = await BlogPost.find({ siteId: resolvedId, status: 'yayında' }).sort({ createdAt: -1 }).lean()
    posts = posts.filter(isPostActive)
    const list = posts.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      content: p.content || '',
      image: toAbsoluteImageUrl(baseUrl, p.image),
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      publishedAt: p.publishedAt?.toISOString?.() || null,
      displayDates: (p.displayDates || []).map((d) => (d && d.toISOString ? d.toISOString() : d)).filter(Boolean),
      createdAt: p.createdAt?.toISOString?.(),
    }))
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Yazılar yüklenemedi.' })
  }
})

/** Herkese açık: sadece aktif ürünler + site filtre tanımları (productFilters) */
router.get('/sites/:siteId/products', async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) {
      return res.json({ productFilters: [], products: [] })
    }
    const baseUrl = getBaseUrl(req)
    const [site, products] = await Promise.all([
      Site.findOne({ id: resolvedId }).lean(),
      Product.find({ siteId: siteIdQuery(resolvedId), status: 'aktif' }).sort({ createdAt: -1 }).lean(),
    ])
    const productFilters = (site && site.productFilters) ? site.productFilters : []
    const siteInfo = site ? {
      primaryColor: site.primaryColor || '',
      secondaryColor: site.secondaryColor || '',
      maintenanceMode: !!site.maintenanceMode,
    } : { primaryColor: '', secondaryColor: '', maintenanceMode: false }
    const list = products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      price: p.price,
      description: p.description || '',
      image: toAbsoluteImageUrl(baseUrl, p.image),
      filters: p.filters && typeof p.filters === 'object' ? p.filters : {},
      attachments: (Array.isArray(p.attachments) ? p.attachments : []).map((a) => ({
        name: a.name || '',
        url: a.url ? (a.url.startsWith('http') ? a.url : `${baseUrl}${a.url.startsWith('/') ? '' : '/'}${a.url}`) : '',
      })),
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      hcpProfessionalGate: p.hcpProfessionalGate !== false,
      createdAt: p.createdAt?.toISOString?.(),
    }))
    res.json({ productFilters, products: list, site: siteInfo })
  } catch (err) {
    res.status(500).json({ error: 'Ürünler yüklenemedi.' })
  }
})

/** Herkese açık: aktif etkinlikler (sıra + tarih) */
router.get('/sites/:siteId/events', async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) {
      return res.json([])
    }
    const baseUrl = getBaseUrl(req)
    const events = await SiteEvent.find({ siteId: siteIdQuery(resolvedId), status: 'aktif' })
      .sort({ sortOrder: 1, eventDate: -1, createdAt: -1 })
      .lean()
    const list = events.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      slug: e.slug || '',
      description: e.description || '',
      eventDate: e.eventDate?.toISOString?.() || null,
      location: e.location || '',
      image: toAbsoluteImageUrl(baseUrl, e.image),
      linkUrl: e.linkUrl || '',
      createdAt: e.createdAt?.toISOString?.(),
    }))
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Etkinlikler yüklenemedi.' })
  }
})

export default router
