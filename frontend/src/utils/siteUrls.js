/**
 * Site ayarlarındaki metni tam URL yapar (yeni sekmede açmak için).
 */
export function normalizePublicUrl(raw) {
  const u = String(raw || '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  if (/^localhost\b/i.test(u) || /^127\.0\.0\.1\b/.test(u)) return `http://${u}`
  return `https://${u}`
}

/** Bu admin panelinde sitenin yönetim girişi (dashboard) yolu */
export function siteAdminDashboardPath(siteId) {
  const id = encodeURIComponent(siteId)
  return `/sites/${id}/dashboard`
}
