import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { API_BASE, getBlog, createBlogPost, updateBlogPost, deleteBlogPost, uploadImage } from '../api/client'
import { useToast } from '../context/ToastContext'

const imageSrc = (path) => (!path ? '' : path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`)

const KEEP_DAYS_OPTIONS = [
  { value: 7, label: '7 gün' },
  { value: 14, label: '14 gün' },
  { value: 30, label: '30 gün' },
  { value: 90, label: '90 gün' },
  { value: 365, label: '1 yıl' },
]

const emptyForm = {
  title: '',
  slug: '',
  content: '',
  image: '',
  status: 'taslak',
  publishedAt: '',
  displayDates: [],
  keepPermanent: true,
  keepForDays: 30,
  metaTitle: '',
  metaDescription: '',
}

export default function BlogPage() {
  const { siteId } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const { showToast } = useToast()

  const load = () => {
    setLoading(true)
    setError('')
    getBlog(siteId)
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [siteId])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    if (modalOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const filteredPosts = useMemo(() => {
    let list = [...posts]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) => (p.title || '').toLowerCase().includes(q) || (p.content || '').toLowerCase().includes(q))
    }
    if (filterStatus) list = list.filter((p) => p.status === filterStatus)
    if (sortOrder === 'newest') list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    if (sortOrder === 'oldest') list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    if (sortOrder === 'title') list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    return list
  }, [posts, search, filterStatus, sortOrder])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (post) => {
    setEditing(post)
    const pub = post.publishedAt ? post.publishedAt.slice(0, 10) : ''
    const dates = Array.isArray(post.displayDates)
      ? post.displayDates.map((d) => (d ? String(d).slice(0, 10) : '')).filter(Boolean)
      : pub ? [pub] : []
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      content: post.content || '',
      image: post.image || '',
      status: post.status || 'taslak',
      publishedAt: pub,
      displayDates: dates.length ? dates : (pub ? [pub] : []),
      keepPermanent: post.keepPermanent !== false,
      keepForDays: post.keepForDays ?? 30,
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
    })
    setError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Başlık zorunludur.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateBlogPost(siteId, editing.id, form)
      } else {
        await createBlogPost(siteId, form)
      }
      closeModal()
      load()
      showToast(editing ? 'Yazı güncellendi.' : 'Yazı eklendi.', 'success')
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteBlogPost(siteId, deleteConfirmId)
      setDeleteConfirmId(null)
      load()
      showToast('Yazı silindi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const slugFromTitle = (title) =>
    title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

  return (
    <div>
      <h2>Blog Yazıları</h2>
      <p>Bu siteye ait blog yazılarını listeleyip düzenleyebilirsiniz.</p>
      {error && !modalOpen && <div className="auth-error">{error}</div>}
      <div className="list-header">
        <button type="button" onClick={openCreate}>
          Yeni Yazı Ekle
        </button>
      </div>
      {!loading && (
        <div className="toolbar">
          <input
            type="search"
            placeholder="Ara (başlık, içerik…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tüm durumlar</option>
            <option value="yayında">Yayında</option>
            <option value="taslak">Taslak</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="newest">En yeni</option>
            <option value="oldest">En eski</option>
            <option value="title">Başlığa göre</option>
          </select>
        </div>
      )}
      {loading ? (
        <p>Yükleniyor…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Görsel</th>
              <th>Başlık</th>
              <th>Durum</th>
              <th>Yayın tarihi</th>
              <th>Kalma süresi</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.map((post) => (
              <tr key={post.id}>
                <td>
                  {post.image ? (
                    <img src={imageSrc(post.image)} alt="" className="blog-list-thumb" />
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>{post.title}</td>
                <td>{post.status}</td>
                <td>
                  {post.displayDates?.length > 0
                    ? post.displayDates
                        .map((d) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }))
                        .join(', ')
                    : post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('tr-TR')
                      : '—'}
                </td>
                <td>
                  {post.keepPermanent ? 'Sürekli sabit' : `${post.keepForDays} gün`}
                </td>
                <td>
                  <button type="button" onClick={() => openEdit(post)}>
                    Düzenle
                  </button>
                  <button type="button" onClick={() => handleDelete(post.id)}>
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteConfirmId && (
        <div className="confirm-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <p>Bu yazıyı silmek istediğinize emin misiniz?</p>
            <div className="confirm-actions">
              <button type="button" className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>İptal</button>
              <button type="button" className="btn-danger" onClick={confirmDelete}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Yazıyı Düzenle' : 'Yeni Blog Yazısı'}</h3>
            {error && modalOpen && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                Başlık *
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: editing ? f.slug : slugFromTitle(e.target.value),
                    }))
                  }}
                  required
                />
              </label>
              <label>
                Slug (URL)
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="otomatik doldurulur"
                />
              </label>
              <label>
                Kapak / öne çıkan resim
                <div className="image-upload-row">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading(true)
                      setError('')
                      try {
                        const url = await uploadImage(file)
                        setForm((f) => ({ ...f, image: url }))
                      } catch (err) {
                        setError(err.message)
                      } finally {
                        setUploading(false)
                        e.target.value = ''
                      }
                    }}
                    disabled={uploading}
                  />
                  {uploading && <span className="upload-status">Yükleniyor…</span>}
                </div>
                {form.image ? (
                  <div className="image-preview-wrap">
                    <div className="image-preview">
                      <img src={imageSrc(form.image)} alt="" />
                    </div>
                    <button
                      type="button"
                      className="btn-remove-image"
                      onClick={() => setForm((f) => ({ ...f, image: '' }))}
                    >
                      Resmi kaldır
                    </button>
                  </div>
                ) : null}
              </label>
              <label>
                İçerik
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={6}
                />
              </label>
              <label>
                Durum
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="taslak">Taslak</option>
                  <option value="yayında">Yayında</option>
                </select>
              </label>
              <label>
                SEO başlık (meta title)
                <input
                  type="text"
                  value={form.metaTitle}
                  onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                  placeholder="Arama sonuçlarında görünsün"
                />
              </label>
              <label>
                SEO açıklama (meta description)
                <textarea
                  value={form.metaDescription}
                  onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                  rows={2}
                  placeholder="Kısa açıklama (arama motorları)"
                />
              </label>
              <label>
                Yayın / geçerlilik tarihleri (birden fazla seçebilirsiniz, örn. 11, 12, 13 Şubat)
                <div className="display-dates-list">
                  {(form.displayDates || []).map((dateVal, idx) => (
                    <div key={idx} className="display-date-row">
                      <input
                        type="date"
                        value={dateVal}
                        onChange={(e) => {
                          const next = [...(form.displayDates || [])]
                          next[idx] = e.target.value
                          setForm((f) => ({ ...f, displayDates: next }))
                        }}
                      />
                      <button
                        type="button"
                        className="btn-remove-date"
                        onClick={() => {
                          const next = (form.displayDates || []).filter((_, i) => i !== idx)
                          setForm((f) => ({ ...f, displayDates: next }))
                        }}
                        title="Bu tarihi kaldır"
                      >
                        Kaldır
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-add-date"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        displayDates: [...(f.displayDates || []), new Date().toISOString().slice(0, 10)],
                      }))
                    }
                  >
                    + Tarih ekle
                  </button>
                </div>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.keepPermanent}
                  onChange={(e) => setForm((f) => ({ ...f, keepPermanent: e.target.checked }))}
                />
                <span>Sürekli sabit kalsın (süre dolmasın)</span>
              </label>
              {!form.keepPermanent && (
                <label>
                  Tarihten sonra ne kadar kalsın?
                  <select
                    value={form.keepForDays}
                    onChange={(e) => setForm((f) => ({ ...f, keepForDays: Number(e.target.value) }))}
                  >
                    {KEEP_DAYS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  İptal
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Kaydediliyor…' : editing ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
