function resolveApiBase() {
  const envBase = import.meta.env.VITE_API_BASE
  if (typeof envBase === 'string' && envBase.trim()) return envBase.trim().replace(/\/+$/, '')

  // Env yoksa, hangi host'ta açıldıysa ona göre backend'i tahmin et.
  // Prod: http://85.235.74.60:3001  | Local: http://127.0.0.1:3001
  const host = window.location.hostname || 'localhost'
  const protocol = window.location.protocol || 'http:'
  return `${protocol}//${host}:3001`
}

// Backend base URL (Vite env). Örn: http://85.235.74.60:3001
export const API_BASE = resolveApiBase()
const API = `${API_BASE}/api`

function getAuthHeader() {
  return {}
}

/** 401 alındığında oturumu temizleyip giriş sayfasına yönlendirir */
function handle401(res) {
  if (res.status === 401) {
    throw new Error('Yetkisiz erişim.')
  }
}

export async function login(password) {
  throw new Error('Login devre dışı.')
}

export async function logout() {
  try {
    await fetch(`${API}/auth/logout`, { method: 'POST' })
  } catch (_) {}
}

export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Yükleme başarısız.')
  return data.url
}

/** PDF, Word, Excel vb. doküman yükle (ürün ek dosyaları / kullanım kılavuzu) */
export async function uploadDocument(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API}/upload/document`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Dosya yüklenemedi.')
  return data.url
}

export async function getSites() {
  const res = await fetch(`${API}/sites`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(Array.isArray(data) ? 'Siteler yüklenemedi.' : (data.error || 'Hata'))
  return data
}

/** Tüm panel istatistikleri (site sayısı, ürün/blog/domain toplamları, yüklenen MB, site bazlı dağılım) */
export async function getStats() {
  const res = await fetch(`${API}/stats`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'İstatistikler alınamadı.')
  return data
}

/** Son işlemler (ürün/blog ekleme, güncelleme, silme) */
export async function getActivity() {
  const res = await fetch(`${API}/activity`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(Array.isArray(data) ? 'Aktivite alınamadı.' : (data.error || 'Hata'))
  return data
}

/** Ürün listesini JSON olarak indir */
export async function exportProducts(siteId) {
  const res = await fetch(`${API}/export/products?siteId=${encodeURIComponent(siteId)}`, { headers: getAuthHeader() })
  handle401(res)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Dışa aktarılamadı.')
  }
  return res.json()
}

/** Blog yazılarını JSON olarak indir */
export async function exportBlog(siteId) {
  const res = await fetch(`${API}/export/blog?siteId=${encodeURIComponent(siteId)}`, { headers: getAuthHeader() })
  handle401(res)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Dışa aktarılamadı.')
  }
  return res.json()
}

/** Şirket içi duyurular */
export async function getAnnouncements(siteId) {
  const q = siteId ? `?siteId=${encodeURIComponent(siteId)}` : ''
  const res = await fetch(`${API}/announcements${q}`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(Array.isArray(data) ? 'Duyurular alınamadı.' : (data.error || 'Hata'))
  return data
}

export async function createAnnouncement(body) {
  const res = await fetch(`${API}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Eklenemedi.')
  return data
}

export async function updateAnnouncement(id, body) {
  const res = await fetch(`${API}/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Güncellenemedi.')
  return data
}

export async function deleteAnnouncement(id) {
  const res = await fetch(`${API}/announcements/${id}`, { method: 'DELETE', headers: getAuthHeader() })
  handle401(res)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Silinemedi.')
  }
  return res.json().catch(() => ({}))
}

/** Şirket içi hızlı linkler */
export async function getQuickLinks() {
  const res = await fetch(`${API}/quick-links`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(Array.isArray(data) ? 'Linkler alınamadı.' : (data.error || 'Hata'))
  return data
}

export async function createQuickLink(body) {
  const res = await fetch(`${API}/quick-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Eklenemedi.')
  return data
}

export async function updateQuickLink(id, body) {
  const res = await fetch(`${API}/quick-links/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Güncellenemedi.')
  return data
}

export async function deleteQuickLink(id) {
  const res = await fetch(`${API}/quick-links/${id}`, { method: 'DELETE', headers: getAuthHeader() })
  handle401(res)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Silinemedi.')
  }
  return res.json().catch(() => ({}))
}

/** Şirket içi notlar (siteId boş = genel notlar) */
export async function getNotes(siteId) {
  const q = siteId !== undefined && siteId !== null ? `?siteId=${encodeURIComponent(siteId)}` : ''
  const res = await fetch(`${API}/notes${q}`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(Array.isArray(data) ? 'Notlar alınamadı.' : (data.error || 'Hata'))
  return data
}

export async function createNote(body) {
  const res = await fetch(`${API}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Eklenemedi.')
  return data
}

export async function updateNote(id, body) {
  const res = await fetch(`${API}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Güncellenemedi.')
  return data
}

export async function deleteNote(id) {
  const res = await fetch(`${API}/notes/${id}`, { method: 'DELETE', headers: getAuthHeader() })
  handle401(res)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Silinemedi.')
  }
  return res.json().catch(() => ({}))
}

export async function getSite(siteId) {
  const res = await fetch(`${API}/sites/${siteId}`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Site alınamadı.')
  return data
}

export async function updateSite(siteId, body) {
  const res = await fetch(`${API}/sites/${siteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Güncellenemedi.')
  return data
}

export async function getBlog(siteId) {
  const res = await fetch(`${API}/sites/${siteId}/blog`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(Array.isArray(data) ? 'Yazılar yüklenemedi.' : (data.error || 'Hata'))
  return data
}

export async function createBlogPost(siteId, body) {
  const res = await fetch(`${API}/sites/${siteId}/blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Eklenemedi.')
  return data
}

export async function updateBlogPost(siteId, id, body) {
  const res = await fetch(`${API}/sites/${siteId}/blog/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Güncellenemedi.')
  return data
}

export async function deleteBlogPost(siteId, id) {
  const res = await fetch(`${API}/sites/${siteId}/blog/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })
  handle401(res)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Silinemedi.')
  }
  return res.json().catch(() => ({}))
}

export async function getEvents(siteId) {
  const res = await fetch(`${API}/sites/${siteId}/events`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(Array.isArray(data) ? 'Etkinlikler yüklenemedi.' : (data.error || 'Hata'))
  return data
}

export async function createEvent(siteId, body) {
  const res = await fetch(`${API}/sites/${siteId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Eklenemedi.')
  return data
}

export async function updateEvent(siteId, id, body) {
  const res = await fetch(`${API}/sites/${siteId}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Güncellenemedi.')
  return data
}

export async function deleteEvent(siteId, id) {
  const res = await fetch(`${API}/sites/${siteId}/events/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })
  handle401(res)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Silinemedi.')
  }
  return res.json().catch(() => ({}))
}

export async function getProducts(siteId) {
  const res = await fetch(`${API}/sites/${siteId}/products`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(Array.isArray(data) ? 'Ürünler yüklenemedi.' : (data.error || 'Hata'))
  return data
}

export async function createProduct(siteId, body) {
  const res = await fetch(`${API}/sites/${siteId}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Eklenemedi.')
  return data
}

export async function updateProduct(siteId, id, body) {
  const res = await fetch(`${API}/sites/${siteId}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Güncellenemedi.')
  return data
}

export async function deleteProduct(siteId, id) {
  const res = await fetch(`${API}/sites/${siteId}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })
  handle401(res)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Silinemedi.')
  }
  return res.json().catch(() => ({}))
}

export async function getDomains() {
  const res = await fetch(`${API}/domains`, { headers: getAuthHeader() })
  handle401(res)
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(Array.isArray(data) ? 'Alan adları yüklenemedi.' : (data.error || 'Hata'))
  return data
}

export async function createDomain(body) {
  const res = await fetch(`${API}/domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Alan adı eklenemedi.')
  return data
}

export async function updateDomain(id, body) {
  const res = await fetch(`${API}/domains/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
  handle401(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Alan adı güncellenemedi.')
  return data
}

export async function deleteDomain(id) {
  const res = await fetch(`${API}/domains/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })
  handle401(res)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Alan adı silinemedi.')
  }
  return res.json().catch(() => ({}))
}
