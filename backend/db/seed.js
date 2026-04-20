import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Site from '../models/Site.js'
import { dedupeSites, removeMedartilacDuplicateSites } from './dedupeSites.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const defaultSites = [
  { id: 'medicaGlobal', name: 'Medica Global', logo: '/logolar/1.png', apiBaseUrl: '/api' },
  { id: 'akyPharma', name: 'AKY Pharma', logo: '/logolar/2.png', apiBaseUrl: '/api' },
  { id: 'arthroline', name: 'ArthroLine', logo: '/logolar/3.png', apiBaseUrl: '/api' },
  { id: 'medart', name: 'Medart', logo: '/logolar/4.png', apiBaseUrl: '/api' },
  { id: 'renova', name: 'Renova', logo: '/logolar/5.png', apiBaseUrl: '/api' },
  { id: 'atakentEczadeposu', name: 'Atakent Eczadeposu', logo: '/logolar/6.png', apiBaseUrl: '/api' },
]

function loadSitesFromFile() {
  const path = join(__dirname, '..', 'data', 'sites.json')
  if (!existsSync(path)) return null
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'))
    if (!Array.isArray(data)) return null
    return data
  } catch {
    return null
  }
}

function escapeRegex(s) {
  return String(s || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function titleCase(s) {
  const cleaned = String(s || '').trim().replace(/[-_]+/g, ' ')
  if (!cleaned) return ''
  return cleaned
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function seedSites() {
  const sites = loadSitesFromFile() || defaultSites
  for (const site of sites) {
    const id = String(site.id || '').trim()
    const name = String(site.name || '').trim()
    if (!id || !name) continue

    const incomingApiBaseUrl = typeof site.apiBaseUrl === 'string' ? site.apiBaseUrl.trim() : ''
    const incomingLooksLocal =
      incomingApiBaseUrl.includes('localhost') || incomingApiBaseUrl.includes('127.0.0.1') || incomingApiBaseUrl.startsWith('/api')
    const existing = await Site.findOne({ id }).select('apiBaseUrl').lean()
    const existingApiBaseUrl = typeof existing?.apiBaseUrl === 'string' ? existing.apiBaseUrl.trim() : ''
    const existingLooksRemote =
      !!existingApiBaseUrl &&
      !existingApiBaseUrl.includes('localhost') &&
      !existingApiBaseUrl.includes('127.0.0.1') &&
      !existingApiBaseUrl.startsWith('/api')

    // Prod/Atlas ortamında, sites.json içindeki localhost değerleri yanlışlıkla remote değeri ezmesin.
    const apiBaseUrlToSet =
      incomingApiBaseUrl
        ? (incomingLooksLocal && existingLooksRemote ? existingApiBaseUrl : incomingApiBaseUrl)
        : existingApiBaseUrl

    await Site.updateOne(
      { id },
      {
        $set: {
          name,
          logo: site.logo || '',
          apiBaseUrl: apiBaseUrlToSet || '',
        },
        $setOnInsert: { productFilters: [] },
      },
      { upsert: true }
    )
  }

  // Repo root’daki klasörleri tarayarak admin panelde görünmesini sağla:
  // - Vite app klasörü ise (package.json var) "site alias" olarak ekle
  // - Herhangi bir site kaydı bulunamazsa klasör adıyla yeni site kaydı aç
  //
  // Not: Bazı isimler (örn. "medartilac" klasörü vs DB’de "medart") case dışında değişebilir.
  // Bu durumda bilinen eşleştirme ile alias ekliyoruz.
  const repoRoot = join(__dirname, '..', '..', '..')
  const aliasHints = {
    medartilac: 'medart',
    // Front (medicaglobal/) SITE_ID = medicaglobal → admin’deki Medica Global kaydı (medicaGlobal)
    medicaglobal: 'medicaGlobal',
  }

  let dirNames = []
  try {
    dirNames = readdirSync(repoRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  } catch {
    dirNames = []
  }

  const candidates = dirNames
    .filter((n) => n && !['admin', 'node_modules', '.git'].includes(n))
    .filter((n) => existsSync(join(repoRoot, n, 'package.json')))

  for (const folderName of candidates) {
    const folderId = String(folderName).trim()
    if (!folderId) continue

    const rx = new RegExp(`^${escapeRegex(folderId)}$`, 'i')
    const match = await Site.findOne({ $or: [{ id: { $regex: rx } }, { aliases: { $regex: rx } }] }).lean()
    if (match?.id) {
      // Klasör adı zaten canonical id ile aynıysa gereksiz alias ekleme (çift kart / kopya izlenimi)
      if (String(folderId).toLowerCase() !== String(match.id).toLowerCase()) {
        await Site.updateOne({ id: match.id }, { $addToSet: { aliases: folderId } })
      }
      continue
    }

    const hintedCanonical = aliasHints[folderId]
    if (hintedCanonical) {
      const canonicalRx = new RegExp(`^${escapeRegex(hintedCanonical)}$`, 'i')
      const canonical = await Site.findOne({ id: { $regex: canonicalRx } }).lean()
      if (canonical?.id) {
        if (String(folderId).toLowerCase() !== String(canonical.id).toLowerCase()) {
          await Site.updateOne({ id: canonical.id }, { $addToSet: { aliases: folderId } })
        }
        continue
      }
      // Canonik kayıt yoksa klasör adıyla (medartilac vb.) AYRI site açma — önce canonical oluştur, alias ekle
      await Site.updateOne(
        { id: hintedCanonical },
        {
          $set: {
            name: titleCase(hintedCanonical) || hintedCanonical,
            logo: '',
          apiBaseUrl: '/api',
            blogEnabled: true,
          },
          $setOnInsert: { productFilters: [] },
        },
        { upsert: true }
      )
      if (String(folderId).toLowerCase() !== String(hintedCanonical).toLowerCase()) {
        await Site.updateOne({ id: hintedCanonical }, { $addToSet: { aliases: folderId } })
      }
      continue
    }

    // Yeni site kaydı aç (admin UI otomatik görür).
    await Site.updateOne(
      { id: folderId },
      {
        $set: {
          name: titleCase(folderId) || folderId,
          logo: '',
          apiBaseUrl: '/api',
          blogEnabled: true,
        },
        $setOnInsert: { productFilters: [] },
      },
      { upsert: true }
    )
  }

  // medicaglobal Vite uygulaması SITE_ID=medicaglobal kullanır; ürünler her zaman admin’deki Medica Global ile aynı bucket’ta olsun.
  await Site.updateOne({ id: 'medicaGlobal' }, { $addToSet: { aliases: 'medicaglobal' } })

  // Aynı site için farklı yazımlar (MedicaGlobal / medicaGlobal) veya çift seed kaynaklarından oluşan kopyaları tekilleştir
  await dedupeSites(defaultSites)

  // medartilac klasörü / kopya site satırları → tek Medart (medart) kaydı
  await removeMedartilacDuplicateSites()

  console.log('Siteler güncellendi (seed).')
}
