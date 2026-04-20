import Product from '../models/Product.js'
import BlogPost from '../models/BlogPost.js'
import Domain from '../models/Domain.js'
import Announcement from '../models/Announcement.js'
import InternalNote from '../models/InternalNote.js'
import ActivityLog from '../models/ActivityLog.js'
import Site from '../models/Site.js'

function escapeRegex(s) {
  return String(s || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function siteIdRegex(id) {
  return new RegExp(`^${escapeRegex(id)}$`, 'i')
}

/**
 * Tüm ilişkili koleksiyonlarda siteId stringini günceller (tam eşleşme, b/k duyarsız).
 */
async function reassignSiteId(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return
  const rx = siteIdRegex(fromId)
  await Product.updateMany({ siteId: rx }, { $set: { siteId: toId } })
  await BlogPost.updateMany({ siteId: rx }, { $set: { siteId: toId } })
  await Domain.updateMany({ siteId: rx }, { $set: { siteId: toId } })
  await Announcement.updateMany({ siteId: rx }, { $set: { siteId: toId } })
  await InternalNote.updateMany({ siteId: rx }, { $set: { siteId: toId } })
  await ActivityLog.updateMany({ siteId: rx }, { $set: { siteId: toId } })
}

async function countSiteUsage(siteId) {
  const rx = siteIdRegex(siteId)
  const [p, b] = await Promise.all([
    Product.countDocuments({ siteId: rx }),
    BlogPost.countDocuments({ siteId: rx }),
  ])
  return p + b
}

/**
 * Aynı site için büyük/küçük harf veya çift seed kaynaklarından oluşan yinelenen Site dokümanlarını
 * tek kayıtta birleştirir; ürün/blog vb. canonical id altına taşınır.
 *
 * @param {Array<{ id: string, name: string }>} canonicalList - Öncelikli id yazımı (örn. defaultSites)
 */
export async function dedupeSites(canonicalList) {
  const all = await Site.find().lean()
  const byLower = new Map()
  for (const s of all) {
    const k = String(s.id || '').toLowerCase()
    if (!k) continue
    if (!byLower.has(k)) byLower.set(k, [])
    byLower.get(k).push(s)
  }

  const preferredIds = Array.isArray(canonicalList)
    ? canonicalList.map((x) => String(x.id || '').trim()).filter(Boolean)
    : []

  async function resolveCanonicalId(group) {
    const ids = group.map((g) => g.id)
    for (const pref of preferredIds) {
      if (ids.some((id) => id.toLowerCase() === pref.toLowerCase())) return pref
    }
    let best = group[0]
    let bestScore = -1
    for (const s of group) {
      const sc = await countSiteUsage(s.id)
      if (sc > bestScore) {
        best = s
        bestScore = sc
      }
    }
    return best.id
  }

  for (const [, group] of byLower) {
    if (group.length < 2) continue

    const canonicalId = await resolveCanonicalId(group)
    const primary =
      group.find((s) => s.id === canonicalId) ||
      group.find((s) => s.id.toLowerCase() === canonicalId.toLowerCase()) ||
      group[0]

    const others = group.filter((s) => s._id.toString() !== primary._id.toString())

    for (const o of others) {
      await reassignSiteId(o.id, canonicalId)
      await Site.deleteOne({ _id: o._id })
    }

    if (primary.id !== canonicalId) {
      await reassignSiteId(primary.id, canonicalId)
      await Site.updateOne({ _id: primary._id }, { $set: { id: canonicalId } })
    }

    const aliasSet = new Set()
    for (const s of group) {
      if (s.id.toLowerCase() !== canonicalId.toLowerCase()) aliasSet.add(s.id)
      for (const a of Array.isArray(s.aliases) ? s.aliases : []) {
        if (a && String(a).trim()) aliasSet.add(String(a).trim())
      }
    }
    aliasSet.delete(canonicalId)
    for (const a of [...aliasSet]) {
      if (a.toLowerCase() === canonicalId.toLowerCase()) aliasSet.delete(a)
    }

    await Site.updateOne(
      { id: canonicalId },
      {
        $set: {
          aliases: [...aliasSet],
        },
      }
    )
  }

  // Tekil kayıtlarda: alias listesinden site id ile aynı (b/k duyarsız) girdileri at
  const rest = await Site.find().lean()
  for (const s of rest) {
    const sid = String(s.id)
    const raw = Array.isArray(s.aliases) ? s.aliases : []
    const filtered = raw.filter(
      (a) => a && String(a).trim() && String(a).toLowerCase() !== sid.toLowerCase()
    )
    const uniq = [...new Set(filtered.map((x) => String(x).trim()))]
    if (uniq.length !== raw.length || uniq.some((v, i) => v !== raw[i])) {
      await Site.updateOne({ id: s.id }, { $set: { aliases: uniq } })
    }
  }

  console.log('Yinelenen siteler birleştirildi (dedupeSites).')
}

/**
 * Klasör adıyla oluşmuş ayrı Site satırını kaldırır; içeriği canonical siteye taşır (örn. medartilac → medart).
 * Admin’de tek “Medart” kartı kalır; front VITE_SITE_ID=medartilac çözümlemesi alias ile çalışır.
 */
export async function mergeAliasSiteIntoCanonical(fromId, toCanonicalId) {
  const from = String(fromId || '').trim()
  const to = String(toCanonicalId || '').trim()
  if (!from || !to || from.toLowerCase() === to.toLowerCase()) return

  const fromDocs = await Site.find({ id: siteIdRegex(from) }).lean()
  const toDoc = await Site.findOne({ id: siteIdRegex(to) }).lean()

  for (const fromDoc of fromDocs) {
    if (fromDoc.id.toLowerCase() === to.toLowerCase()) continue

    if (toDoc) {
      await reassignSiteId(fromDoc.id, toDoc.id)
      await Site.deleteOne({ _id: fromDoc._id })
      await Site.updateOne({ id: toDoc.id }, { $addToSet: { aliases: from } })
    } else {
      await reassignSiteId(fromDoc.id, to)
      await Site.updateOne({ _id: fromDoc._id }, { $set: { id: to } })
    }
  }

  if (fromDocs.length) {
    console.log(`Site birleştirildi: ${from} → ${to}`)
  }
}

/**
 * Admin’deki “medartilac”, “medartilac copy” vb. tüm kopyaları kaldırır; tek kaynak `medart` (Medart) olur.
 */
export async function removeMedartilacDuplicateSites() {
  const idDupes = await Site.find({ id: { $regex: /^medartilac/i } }).lean()
  for (const d of idDupes) {
    if (String(d.id).toLowerCase() === 'medart') continue
    await mergeAliasSiteIntoCanonical(d.id, 'medart')
  }

  const nameDupes = await Site.find({
    name: { $regex: /medartilac.*(copy|kopya)|(copy|kopya).*medartilac/i },
  }).lean()
  for (const d of nameDupes) {
    if (String(d.id).toLowerCase() === 'medart') continue
    await mergeAliasSiteIntoCanonical(d.id, 'medart')
  }

  await Site.updateOne({ id: 'medart' }, { $addToSet: { aliases: 'medartilac' } })
  console.log('medartilac kopya site kayıtları medart ile birleştirildi.')
}
