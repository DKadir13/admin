import Site from '../models/Site.js'

/**
 * URL/parametredeki siteId'yi veritabanındaki site ile eşleştirir (büyük/küçük harf duyarsız).
 * Admin paneli ve public API'de tutarlı site eşlemesi için kullanılır.
 * @param {string} siteIdParam - İstekten gelen site id (örn. atakentEczadeposu, AtakentEczadeposu)
 * @returns {Promise<string|null>} Veritabanındaki canonical site id veya null
 */
export async function resolveSiteId(siteIdParam) {
  if (!siteIdParam || typeof siteIdParam !== 'string') return null
  const safe = siteIdParam.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const rx = new RegExp(`^${safe}$`, 'i')
  const site = await Site.findOne({
    $or: [{ id: { $regex: rx } }, { aliases: { $regex: rx } }],
  }).lean()
  return site ? site.id : null
}
