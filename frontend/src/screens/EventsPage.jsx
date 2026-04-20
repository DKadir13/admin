import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getEvents, createEvent, updateEvent, deleteEvent, uploadImage } from '../api/client'
import { useToast } from '../context/ToastContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
const imageSrc = (path) => (!path ? '' : path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`)

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  eventDate: '',
  location: '',
  image: '',
  linkUrl: '',
  status: 'aktif',
  sortOrder: 0,
}

export default function EventsPage() {
  const { siteId } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const { showToast } = useToast()

  const load = () => {
    setLoading(true)
    setError('')
    getEvents(siteId)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [siteId])

  const sorted = useMemo(() => [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || new Date(b.eventDate || 0) - new Date(a.eventDate || 0)), [items])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      title: row.title || '',
      slug: row.slug || '',
      description: row.description || '',
      eventDate: row.eventDate ? String(row.eventDate).slice(0, 10) : '',
      location: row.location || '',
      image: row.image || '',
      linkUrl: row.linkUrl || '',
      status: row.status || 'aktif',
      sortOrder: row.sortOrder ?? 0,
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
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
      }
      if (editing) {
        await updateEvent(siteId, editing.id, payload)
      } else {
        await createEvent(siteId, payload)
      }
      closeModal()
      load()
      showToast(editing ? 'Etkinlik güncellendi.' : 'Etkinlik eklendi.', 'success')
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
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
      <h2>Etkinlikler</h2>
      <p>Bu site için etkinlik ve fuar duyurularını ekleyin; AKY Pharma sitesi bunları otomatik listeler.</p>
      {error && !modalOpen && <div className="auth-error">{error}</div>}
      <div className="list-header">
        <button type="button" onClick={openCreate}>
          Yeni etkinlik
        </button>
      </div>

      {loading ? (
        <p>Yükleniyor…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Başlık</th>
              <th>Tarih</th>
              <th>Yer</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  Henüz etkinlik yok. &quot;Yeni etkinlik&quot; ile ekleyin.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.id}>
                  <td>{row.sortOrder ?? 0}</td>
                  <td>{row.title}</td>
                  <td>{row.eventDate ? new Date(row.eventDate).toLocaleDateString('tr-TR') : '—'}</td>
                  <td>{row.location || '—'}</td>
                  <td>{row.status}</td>
                  <td>
                    <button type="button" onClick={() => openEdit(row)}>
                      Düzenle
                    </button>{' '}
                    <button type="button" onClick={() => setDeleteConfirmId(row.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {deleteConfirmId ? (
        <div className="confirm-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <p>Bu etkinliği silmek istediğinize emin misiniz?</p>
            <div className="confirm-actions">
              <button type="button" className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>
                İptal
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={async () => {
                  try {
                    await deleteEvent(siteId, deleteConfirmId)
                    setDeleteConfirmId(null)
                    load()
                    showToast('Etkinlik silindi.', 'success')
                  } catch (err) {
                    showToast(err.message, 'error')
                  }
                }}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Etkinliği düzenle' : 'Yeni etkinlik'}</h3>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                Başlık *
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: editing ? f.slug : slugFromTitle(e.target.value),
                    }))
                  }
                  required
                />
              </label>
              <label>
                Slug (URL)
                <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </label>
              <label>
                Açıklama
                <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label>
                Etkinlik tarihi
                <input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} />
              </label>
              <label>
                Yer / şehir
                <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </label>
              <label>
                Görsel
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
                    <button type="button" className="btn-remove-image" onClick={() => setForm((f) => ({ ...f, image: '' }))}>
                      Kaldır
                    </button>
                  </div>
                ) : null}
              </label>
              <label>
                Bağlantı (opsiyonel)
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.linkUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                />
              </label>
              <label>
                Liste sırası (küçük önce)
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </label>
              <label>
                Durum
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="aktif">Aktif (sitede görünür)</option>
                  <option value="pasif">Pasif</option>
                </select>
              </label>
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
      ) : null}
    </div>
  )
}
