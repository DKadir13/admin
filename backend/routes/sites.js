import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Site from '../models/Site.js'
import { resolveSiteId } from '../utils/siteId.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const sites = await Site.find().lean()
    const list = sites.map((s) => ({
      id: s.id,
      name: s.name,
      logo: s.logo || '',
      publicUrl: s.publicUrl || '',
      apiBaseUrl: s.apiBaseUrl || '',
      primaryColor: s.primaryColor || '',
      secondaryColor: s.secondaryColor || '',
      aliases: Array.isArray(s.aliases) ? s.aliases : [],
      blogEnabled: !!s.blogEnabled,
      maintenanceMode: !!s.maintenanceMode,
      productFilters: s.productFilters || [],
    }))
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Siteler yüklenemedi.' })
  }
})

router.get('/:siteId', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const site = await Site.findOne({ id: resolvedId }).lean()
    if (!site) return res.status(404).json({ error: 'Site bulunamadı.' })
    res.json({
      id: site.id,
      name: site.name,
      logo: site.logo || '',
      publicUrl: site.publicUrl || '',
      apiBaseUrl: site.apiBaseUrl || '',
      primaryColor: site.primaryColor || '',
      secondaryColor: site.secondaryColor || '',
      aliases: Array.isArray(site.aliases) ? site.aliases : [],
      blogEnabled: !!site.blogEnabled,
      maintenanceMode: !!site.maintenanceMode,
      productFilters: site.productFilters || [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Site alınamadı.' })
  }
})

router.put('/:siteId', authMiddleware, async (req, res) => {
  try {
    const resolvedId = await resolveSiteId(req.params.siteId)
    if (!resolvedId) return res.status(404).json({ error: 'Site bulunamadı.' })
    const { productFilters, name, logo, publicUrl, apiBaseUrl, primaryColor, secondaryColor, maintenanceMode, blogEnabled } = req.body || {}
    const valid = Array.isArray(productFilters)
      ? productFilters
          .filter((f) => f && (f.key || f.label))
          .map((f) => ({
            key: String(f.key || (f.label || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'filtre'),
            label: String(f.label || f.key || ''),
            options: Array.isArray(f.options) ? f.options.map((o) => String(o)).filter(Boolean) : [],
          }))
      : undefined
    const update = {}
    if (valid !== undefined) update.productFilters = valid
    if (name != null) update.name = String(name)
    if (logo !== undefined) update.logo = String(logo)
    if (publicUrl !== undefined) update.publicUrl = String(publicUrl || '').trim()
    if (apiBaseUrl !== undefined) update.apiBaseUrl = String(apiBaseUrl)
    if (primaryColor !== undefined) update.primaryColor = String(primaryColor)
    if (secondaryColor !== undefined) update.secondaryColor = String(secondaryColor)
    if (maintenanceMode !== undefined) update.maintenanceMode = !!maintenanceMode
    if (blogEnabled !== undefined) update.blogEnabled = !!blogEnabled
    const site = await Site.findOneAndUpdate(
      { id: resolvedId },
      Object.keys(update).length ? { $set: update } : {},
      { new: true }
    ).lean()
    if (!site) return res.status(404).json({ error: 'Site bulunamadı.' })
    res.json({
      id: site.id,
      name: site.name,
      logo: site.logo || '',
      publicUrl: site.publicUrl || '',
      apiBaseUrl: site.apiBaseUrl || '',
      primaryColor: site.primaryColor || '',
      secondaryColor: site.secondaryColor || '',
      aliases: Array.isArray(site.aliases) ? site.aliases : [],
      blogEnabled: !!site.blogEnabled,
      maintenanceMode: !!site.maintenanceMode,
      productFilters: site.productFilters || [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Güncellenemedi.' })
  }
})

export default router
