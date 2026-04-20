import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getProducts, getSite, updateSite, createProduct, updateProduct, deleteProduct, uploadImage, uploadDocument, getStats } from '../api/client'
import { useToast } from '../context/ToastContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
const imageSrc = (path) => (!path ? '' : path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`)

const slugFromLabel = (label) =>
  (label || '')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '') || 'filtre'

const emptyForm = {
  name: '',
  slug: '',
  price: '',
  description: '',
  image: '',
  status: 'aktif',
  filters: {},
  attachments: [],
  metaTitle: '',
  metaDescription: '',
  hcpProfessionalGate: true,
}

export default function ProductsPage() {
  const { siteId } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [productFilters, setProductFilters] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterForm, setFilterForm] = useState(null)
  const [savingFilters, setSavingFilters] = useState(false)
  const [storageStats, setStorageStats] = useState(null)
  const { showToast } = useToast()

  const loadStorageStats = () => {
    getStats()
      .then((data) => setStorageStats(data))
      .catch(() => setStorageStats(null))
  }

  const load = () => {
    if (!siteId) return
    setLoading(true)
    setError('')
    Promise.all([getProducts(siteId), getSite(siteId)])
      .then(([prods, site]) => {
        setProducts(prods)
        setProductFilters(Array.isArray(site.productFilters) ? site.productFilters : [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [siteId])
  useEffect(() => { loadStorageStats() }, [siteId])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    if (modalOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const filteredProducts = useMemo(() => {
    let list = [...products]
    if (filterStatus) list = list.filter((p) => p.status === filterStatus)
    if (sortOrder === 'newest') list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    if (sortOrder === 'oldest') list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    if (sortOrder === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return list
  }, [products, filterStatus, sortOrder])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    loadStorageStats()
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name || '',
      slug: product.slug || '',
      price: product.price || '',
      description: product.description || '',
      image: product.image || '',
      status: product.status || 'aktif',
      filters: product.filters && typeof product.filters === 'object' ? { ...product.filters } : {},
      attachments: Array.isArray(product.attachments) ? product.attachments.map((a) => ({ name: a.name || '', url: a.url || '' })) : [],
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      hcpProfessionalGate: product.hcpProfessionalGate !== false,
    })
    setError('')
    loadStorageStats()
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Ürün adı zorunludur.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateProduct(siteId, editing.id, form)
      } else {
        await createProduct(siteId, form)
      }
      closeModal()
      load()
      loadStorageStats()
      showToast(editing ? 'Ürün güncellendi.' : 'Ürün eklendi.', 'success')
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id) => setDeleteConfirmId(id)

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteProduct(siteId, deleteConfirmId)
      setDeleteConfirmId(null)
      load()
      showToast('Ürün silindi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const slugFromName = (name) =>
    name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

  const saveProductFilters = async () => {
    const toSave = filterForm != null ? filterForm : productFilters
    setSavingFilters(true)
    setError('')
    try {
      await updateSite(siteId, { productFilters: toSave })
      setProductFilters(toSave)
      setFilterForm(null)
      setFiltersOpen(true)
      showToast('Filtre seçenekleri veritabanına kaydedildi.', 'success')
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setSavingFilters(false)
    }
  }

  const addFilter = () => {
    ensureFilterFormCopy()
    const list = filterForm ?? productFilters
    setFilterForm([...list, { key: 'yeni_filtre', label: 'Yeni Filtre', options: [] }])
    setFiltersOpen(true)
  }

  const ensureFilterFormCopy = () => {
    if (filterForm == null) setFilterForm(productFilters.map((f) => ({ key: f.key, label: f.label, options: [...(f.options || [])] })))
  }

  const updateFilterAt = (index, field, value) => {
    ensureFilterFormCopy()
    const list = filterForm ?? productFilters
    const next = list.map((f, i) =>
      i === index ? { ...f, [field]: value, ...(field === 'label' ? { key: slugFromLabel(value) || f.key } : {}) } : f
    )
    setFilterForm(next)
  }

  const addOptionAt = (filterIndex) => {
    ensureFilterFormCopy()
    const list = filterForm ?? productFilters
    const next = list.map((f, i) =>
      i === filterIndex ? { ...f, options: [...(f.options || []), ''] } : f
    )
    setFilterForm(next)
  }

  const updateOptionAt = (filterIndex, optionIndex, value) => {
    ensureFilterFormCopy()
    const list = filterForm ?? productFilters
    const next = list.map((f, i) => {
      if (i !== filterIndex) return f
      const opts = [...(f.options || [])]
      opts[optionIndex] = value
      return { ...f, options: opts }
    })
    setFilterForm(next)
  }

  const removeOptionAt = (filterIndex, optionIndex) => {
    ensureFilterFormCopy()
    const list = filterForm ?? productFilters
    const next = list.map((f, i) =>
      i === filterIndex
        ? { ...f, options: (f.options || []).filter((_, j) => j !== optionIndex) }
        : f
    )
    setFilterForm(next)
  }

  const removeFilterAt = (index) => {
    ensureFilterFormCopy()
    const list = filterForm ?? productFilters
    setFilterForm(list.filter((_, i) => i !== index))
  }

  const displayFilters = filterForm ?? productFilters

  return (
    <div>
      <h2>Ürünler</h2>
      <p>Bu siteye ait ürünleri listeleyip düzenleyebilirsiniz.</p>
      {error && !modalOpen && <div className="auth-error">{error}</div>}
      <div className="list-header">
        <button type="button" onClick={openCreate}>
          Yeni Ürün Ekle
        </button>
      </div>

      <div className="product-filters-section">
        <button type="button" className="product-filters-toggle" onClick={() => setFiltersOpen((o) => !o)}>
          {filtersOpen ? '▼' : '▶'} Ürün filtre seçenekleri (site genelinde)
          {displayFilters.length > 0 && ` — ${displayFilters.length} filtre`}
        </button>
        {filtersOpen && (
          <div className="product-filters-editor">
            <p className="product-filters-hint">
              Önce bir filtre adı ekleyin (örn: Kategori), sonra &quot;Bu filtreye seçenek ekle&quot; ile aynı filtre altında istediğiniz kadar seçenek ekleyin (Reçeteli, OTC, Takviye…). Ürün eklerken bu filtrelerden birer seçenek atayabilirsiniz. Kaydettiğiniz filtreler veritabanına yazılır.
            </p>
            {displayFilters.length === 0 && filterForm == null && (
              <p className="product-filters-empty">Henüz filtre tanımlanmadı. Aşağıdaki &quot;+ Filtre ekle&quot; ile ekleyip &quot;Filtreleri kaydet&quot; ile veritabanına kaydedin.</p>
            )}
            {displayFilters.map((f, i) => (
              <div key={i} className="product-filter-option-block">
                <div className="product-filter-header-row">
                  <label className="product-filter-field">
                    <span className="product-filter-field-label">Filtre adı</span>
                    <input
                      type="text"
                      placeholder="örn: Kategori"
                      value={f.label}
                      onChange={(e) => updateFilterAt(i, 'label', e.target.value)}
                    />
                  </label>
                  <label className="product-filter-field product-filter-field--key">
                    <span className="product-filter-field-label">Anahtar</span>
                    <input
                      type="text"
                      placeholder="örn: kategori"
                      value={f.key}
                      onChange={(e) => updateFilterAt(i, 'key', e.target.value)}
                    />
                  </label>
                  <button type="button" className="btn-remove-filter" onClick={() => removeFilterAt(i)}>Filtreyi kaldır</button>
                </div>
                <div className="product-filter-options-list">
                  <span className="product-filter-field-label">Bu filtreye ait seçenekler</span>
                  {(f.options || []).map((optVal, j) => (
                    <div key={j} className="product-filter-option-row">
                      <input
                        type="text"
                        placeholder="Seçenek değeri"
                        value={optVal}
                        onChange={(e) => updateOptionAt(i, j, e.target.value)}
                      />
                      <button type="button" className="btn-remove-option" onClick={() => removeOptionAt(i, j)}>Kaldır</button>
                    </div>
                  ))}
                  <button type="button" className="btn-add-option" onClick={() => addOptionAt(i)}>
                    + Bu filtreye seçenek ekle
                  </button>
                </div>
              </div>
            ))}
            <div className="product-filters-actions">
              <button type="button" onClick={addFilter}>+ Filtre ekle</button>
              {filterForm != null && (
                <>
                  <button type="button" className="btn-secondary" onClick={() => setFilterForm(null)}>İptal</button>
                  <button type="button" onClick={saveProductFilters} disabled={savingFilters}>
                    {savingFilters ? 'Kaydediliyor…' : 'Filtreleri kaydet'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {storageStats != null && (
        <p className="products-storage-info">
          Sistemde kullanılan alan: <strong>{storageStats.uploadsSizeMB != null ? `${storageStats.uploadsSizeMB} MB` : '—'}</strong>
          {storageStats.uploadsFileCount != null && ` (${storageStats.uploadsFileCount} dosya)`}
        </p>
      )}
      {!loading && (
        <div className="toolbar toolbar--no-search">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tüm durumlar</option>
            <option value="aktif">Aktif</option>
            <option value="pasif">Pasif</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="newest">En yeni</option>
            <option value="oldest">En eski</option>
            <option value="name">Ada göre</option>
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
              <th>Ürün Adı</th>
              <th>Fiyat</th>
              {productFilters.length > 0 && <th>Filtreler</th>}
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  {product.image ? (
                    <img src={imageSrc(product.image)} alt="" className="blog-list-thumb" />
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>{product.name}</td>
                <td>{product.price}</td>
                {productFilters.length > 0 && (
                  <td className="product-table-filters">
                    {productFilters.some((pf) => product.filters && product.filters[pf.key])
                      ? productFilters.map((pf) => (product.filters && product.filters[pf.key] ? (
                          <span key={pf.key} className="product-filter-badge">{product.filters[pf.key]}</span>
                        ) : null))
                      : '—'}
                  </td>
                )}
                <td>{product.status}</td>
                <td>
                  <button type="button" onClick={() => openEdit(product)}>
                    Düzenle
                  </button>
                  <button type="button" onClick={() => handleDelete(product.id)}>
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
            <p>Bu ürünü silmek istediğinize emin misiniz?</p>
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
            <h3>{editing ? 'Ürünü Düzenle' : 'Yeni Ürün'}</h3>
            {storageStats != null && (
              <p className="products-storage-info products-storage-info--modal">
                Sistemde kullanılan alan: <strong>{storageStats.uploadsSizeMB != null ? `${storageStats.uploadsSizeMB} MB` : '—'}</strong>
                {storageStats.uploadsFileCount != null && ` (${storageStats.uploadsFileCount} dosya)`}
              </p>
            )}
            {error && modalOpen && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                Ürün adı *
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: editing ? f.slug : slugFromName(e.target.value),
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
                Ürün resmi
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
                        loadStorageStats()
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
              <div className="product-attachments-block">
                <span className="product-attachments-title">Ek dosyalar (kullanım kılavuzu vb.)</span>
                <p className="product-attachments-hint">PDF, Word veya Excel yükleyebilirsiniz. Her dosyaya görünen bir ad verin.</p>
                {(form.attachments || []).map((att, idx) => (
                  <div key={idx} className="product-attachment-row">
                    <input
                      type="text"
                      placeholder="Dosya adı (örn: Kullanım Kılavuzu)"
                      value={att.name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          attachments: f.attachments.map((a, i) => (i === idx ? { ...a, name: e.target.value } : a)),
                        }))
                      }
                      className="product-attachment-name"
                    />
                    <a href={att.url.startsWith('http') ? att.url : `${API_BASE}${att.url.startsWith('/') ? '' : '/'}${att.url}`} target="_blank" rel="noopener noreferrer" className="product-attachment-link">
                      Dosya
                    </a>
                    <button
                      type="button"
                      className="btn-remove-attachment"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          attachments: f.attachments.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      Kaldır
                    </button>
                  </div>
                ))}
                <div className="product-attachment-upload">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploadingDoc(true)
                      setError('')
                      try {
                        const url = await uploadDocument(file)
                        setForm((f) => ({
                          ...f,
                          attachments: [...(f.attachments || []), { name: 'Kullanım Kılavuzu', url }],
                        }))
                        loadStorageStats()
                      } catch (err) {
                        setError(err.message)
                      } finally {
                        setUploadingDoc(false)
                        e.target.value = ''
                      }
                    }}
                    disabled={uploadingDoc}
                  />
                  {uploadingDoc && <span className="upload-status">Yükleniyor…</span>}
                </div>
              </div>
              <label>
                Fiyat (opsiyonel)
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="örn: 100 ₺"
                />
              </label>
              <label>
                Açıklama
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </label>
              <label>
                Durum
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="aktif">Aktif</option>
                  <option value="pasif">Pasif</option>
                </select>
              </label>
              <fieldset className="product-hcp-fieldset">
                <legend>Yasal ürün mevzuatı</legend>
                <p className="product-hcp-hint">
                  Ürün detay sayfasında, ilgili mevzuata göre yalnızca sağlık meslek mensuplarına yönelik bilgi uyarısı ve onay seçenekleri gösterilsin mi?
                </p>
                <label className="product-hcp-radio">
                  <input
                    type="radio"
                    name="hcpProfessionalGate"
                    checked={form.hcpProfessionalGate === true}
                    onChange={() => setForm((f) => ({ ...f, hcpProfessionalGate: true }))}
                  />
                  Evet (varsayılan)
                </label>
                <label className="product-hcp-radio">
                  <input
                    type="radio"
                    name="hcpProfessionalGate"
                    checked={form.hcpProfessionalGate === false}
                    onChange={() => setForm((f) => ({ ...f, hcpProfessionalGate: false }))}
                  />
                  Hayır
                </label>
              </fieldset>
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
              {productFilters.length > 0 && (
                <div className="product-form-filters">
                  <span className="product-form-filters-title">Filtreler (ürün sayfasında filtreleme için)</span>
                  {productFilters.map((pf) => (
                    <label key={pf.key}>
                      {pf.label}
                      <select
                        value={form.filters[pf.key] ?? ''}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            filters: { ...f.filters, [pf.key]: e.target.value || undefined },
                          }))
                        }
                      >
                        <option value="">— Seçin —</option>
                        {(pf.options || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
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
