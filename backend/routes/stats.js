import { Router } from 'express'
import { readdirSync, statSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware } from '../middleware/auth.js'
import Site from '../models/Site.js'
import Product from '../models/Product.js'
import BlogPost from '../models/BlogPost.js'
import Domain from '../models/Domain.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadsDir = join(__dirname, '..', 'uploads')

const router = Router()

/** URL veya path'ten dosya adını çıkar (örn. /uploads/doc-123.pdf -> doc-123.pdf) */
function filenameFromUrl(url) {
  if (!url || typeof url !== 'string') return null
  const part = url.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean).pop()
  return part || null
}

/** Veritabanında referansı olan dosya adlarını topla (Product image/attachments, BlogPost image) */
async function getReferencedUploadFilenames() {
  const [products, posts] = await Promise.all([
    Product.find().select('image attachments').lean(),
    BlogPost.find().select('image').lean(),
  ])
  const set = new Set()
  for (const p of products || []) {
    const name = filenameFromUrl(p.image)
    if (name) set.add(name)
    for (const a of p.attachments || []) {
      const n = filenameFromUrl(a?.url)
      if (n) set.add(n)
    }
  }
  for (const p of posts || []) {
    const name = filenameFromUrl(p.image)
    if (name) set.add(name)
  }
  return set
}

/** uploads klasöründe sadece referansı olan dosyaların toplam boyutu ve adedi */
function getUploadsStats(referencedFilenames) {
  let sizeBytes = 0
  let fileCount = 0
  const set = referencedFilenames || new Set()
  function walk(dir) {
    try {
      if (!existsSync(dir)) return
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const e of entries) {
        const full = join(dir, e.name)
        try {
          const stat = statSync(full)
          if (stat.isFile()) {
            if (set.size === 0 || set.has(e.name)) {
              sizeBytes += stat.size
              fileCount += 1
            }
          } else if (stat.isDirectory()) {
            walk(full)
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
  walk(uploadsDir)
  return { sizeBytes, fileCount }
}

/** Tüm panel istatistikleri: site sayısı, ürün/blog/domain toplamları ve dağılımları, site bazlı hepsi, yüklenen dosya boyutu */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const referencedFilenames = await getReferencedUploadFilenames()
    const [
      siteCount,
      productCount,
      blogCount,
      domainCount,
      productsBySite,
      blogsBySite,
      domainsBySite,
      productsByStatus,
      blogsByStatus,
      uploadsStats,
    ] = await Promise.all([
      Site.countDocuments(),
      Product.countDocuments(),
      BlogPost.countDocuments(),
      Domain.countDocuments(),
      Product.aggregate([{ $group: { _id: '$siteId', count: { $sum: 1 } } }]),
      BlogPost.aggregate([{ $group: { _id: '$siteId', count: { $sum: 1 } } }]),
      Domain.aggregate([{ $group: { _id: { $ifNull: ['$siteId', ''] }, count: { $sum: 1 } } }]),
      Product.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      BlogPost.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Promise.resolve(getUploadsStats(referencedFilenames)),
    ])

    const sites = await Site.find().select('id name').lean()
    const productBySiteMap = Object.fromEntries((productsBySite || []).map((x) => [String(x._id), x.count]))
    const blogBySiteMap = Object.fromEntries((blogsBySite || []).map((x) => [String(x._id), x.count]))
    const domainBySiteMap = Object.fromEntries((domainsBySite || []).map((x) => [String(x._id), x.count]))

    const productActive = (productsByStatus || []).find((x) => x._id === 'aktif')?.count || 0
    const productPassive = (productsByStatus || []).find((x) => x._id === 'pasif')?.count || 0
    const blogPublished = (blogsByStatus || []).find((x) => x._id === 'yayında')?.count || 0
    const blogDraft = (blogsByStatus || []).find((x) => x._id === 'taslak')?.count || 0

    const bySite = (sites || []).map((s) => ({
      siteId: s.id,
      siteName: s.name || s.id,
      products: productBySiteMap[String(s.id)] || 0,
      blogPosts: blogBySiteMap[String(s.id)] || 0,
      domains: domainBySiteMap[String(s.id)] || 0,
    }))

    const domainsNoSite = domainBySiteMap[''] || 0

    const uploadsBytes = uploadsStats?.sizeBytes ?? 0
    const uploadsFileCount = uploadsStats?.fileCount ?? 0

    res.json({
      totalSites: siteCount,
      totalProducts: productCount,
      totalProductsActive: productActive,
      totalProductsPassive: productPassive,
      totalBlogPosts: blogCount,
      totalBlogPublished: blogPublished,
      totalBlogDraft: blogDraft,
      totalDomains: domainCount,
      totalDomainsNoSite: domainsNoSite,
      uploadsSizeBytes: uploadsBytes,
      uploadsSizeMB: Math.round((uploadsBytes / (1024 * 1024)) * 100) / 100,
      uploadsFileCount,
      bySite,
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'İstatistikler alınamadı.' })
  }
})

export default router
