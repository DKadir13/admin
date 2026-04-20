/**
 * public/logos altındaki logoların doğru yüklenmesi için tam URL üretir.
 * Böylece logolar her zaman frontend'in servis ettiği adresten yüklenir.
 */
export function logoUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${p}`
}
