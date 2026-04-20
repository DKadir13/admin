import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getDomains, createDomain, updateDomain, deleteDomain, getSites } from '../api/client'
import { useToast } from '../context/ToastContext'

const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV']

const emptyForm = {
  name: '',
  siteId: '',
  expiryDate: '',
  registrar: '',
  notes: '',
  dnsRecords: [],
}

function emptyDnsRow() {
  return { type: 'A', name: '', value: '', ttl: 3600, priority: null }
}

export default function DomainsPage() {
  const { siteId: currentSiteId } = useParams()
  const [domains, setDomains] = useState([])
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterSiteId, setFilterSiteId] = useState('')
  const [sortOrder, setSortOrder] = useState('name')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const { showToast } = useToast()

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([getDomains(), getSites()])
      .then(([domainsList, sitesList]) => {
        setDomains(domainsList)
        setSites(sitesList || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  useEffect(() => {
    if (currentSiteId && !filterSiteId) setFilterSiteId(currentSiteId)
  }, [currentSiteId])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeModal()
        setDeleteConfirmId(null)
      }
    }
    if (modalOpen || deleteConfirmId) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, deleteConfirmId])

  const filteredDomains = useMemo(() => {
    let list = [...domains]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (d) =>
          (d.name || '').toLowerCase().includes(q) ||
          (d.registrar || '').toLowerCase().includes(q) ||
          (d.notes || '').toLowerCase().includes(q)
      )
    }
    if (filterSiteId) list = list.filter((d) => d.siteId === filterSiteId)
    if (sortOrder === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    if (sortOrder === 'expiry') list.sort((a, b) => new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0))
    if (sortOrder === 'expiry-desc') list.sort((a, b) => new Date(b.expiryDate || 0) - new Date(a.expiryDate || 0))
    return list
  }, [domains, search, filterSiteId, sortOrder])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      siteId: currentSiteId || '',
      dnsRecords: [emptyDnsRow()],
    })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (domain) => {
    setEditing(domain)
    setForm({
      name: domain.name || '',
      siteId: domain.siteId || '',
      expiryDate: domain.expiryDate ? domain.expiryDate.slice(0, 10) : '',
      registrar: domain.registrar || '',
      notes: domain.notes || '',
      dnsRecords:
        (domain.dnsRecords && domain.dnsRecords.length) > 0
          ? domain.dnsRecords.map((r) => ({
              type: r.type || 'A',
              name: r.name || '',
              value: r.value || '',
              ttl: r.ttl != null ? r.ttl : 3600,
              priority: r.priority != null ? r.priority : null,
            }))
          : [emptyDnsRow()],
    })
    setError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const addDnsRow = () => {
    setForm((f) => ({ ...f, dnsRecords: [...(f.dnsRecords || []), emptyDnsRow()] }))
  }

  const updateDnsRow = (index, field, value) => {
    setForm((f) => {
      const rows = [...(f.dnsRecords || [])]
      rows[index] = { ...rows[index], [field]: value }
      return { ...f, dnsRecords: rows }
    })
  }

  const removeDnsRow = (index) => {
    setForm((f) => {
      const rows = (f.dnsRecords || []).filter((_, i) => i !== index)
      return { ...f, dnsRecords: rows.length ? rows : [emptyDnsRow()] }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Alan adı zorunludur.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      siteId: form.siteId || '',
      expiryDate: form.expiryDate || null,
      registrar: form.registrar || '',
      notes: form.notes || '',
      dnsRecords: (form.dnsRecords || [])
        .filter((r) => (r.type || r.value) && (r.value || '').trim())
        .map((r) => ({
          type: r.type || 'A',
          name: (r.name || '').trim(),
          value: (r.value || '').trim(),
          ttl: r.ttl != null ? Number(r.ttl) : 3600,
          priority: r.type === 'MX' && r.priority != null && r.priority !== '' ? Number(r.priority) : null,
        })),
    }
    try {
      if (editing) {
        await updateDomain(editing.id, payload)
      } else {
        await createDomain(payload)
      }
      closeModal()
      load()
      showToast(editing ? 'Alan adı güncellendi.' : 'Alan adı eklendi.', 'success')
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
      await deleteDomain(deleteConfirmId)
      setDeleteConfirmId(null)
      load()
      showToast('Alan adı silindi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const siteName = (id) => (id ? (sites.find((s) => s.id === id)?.name || id) : '—')
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('tr-TR') : '—')

  return (
    <div>
      <h2>Alan Adları</h2>
      <p>Tüm alan adlarınızı ve DNS kayıtlarını buradan yönetebilirsiniz.</p>
      {error && !modalOpen && <div className="auth-error">{error}</div>}
      <div className="list-header">
        <button type="button" onClick={openCreate}>
          Yeni Alan Adı Ekle
        </button>
      </div>
      {!loading && (
        <div className="toolbar">
          <input
            type="search"
            placeholder="Ara (alan adı, sağlayıcı, not…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterSiteId} onChange={(e) => setFilterSiteId(e.target.value)}>
            <option value="">Tüm siteler</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="name">Ada göre</option>
            <option value="expiry">Son kullanma (eskiden yeniye)</option>
            <option value="expiry-desc">Son kullanma (yeniden eskiye)</option>
          </select>
        </div>
      )}
      {loading ? (
        <p>Yükleniyor…</p>
      ) : (
        <div className="domains-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Alan adı</th>
                <th>Site</th>
                <th>Son kullanma</th>
                <th>Kayıt sağlayıcı</th>
                <th>DNS kayıtları</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredDomains.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                  </td>
                  <td>{siteName(d.siteId)}</td>
                  <td>{formatDate(d.expiryDate)}</td>
                  <td>{d.registrar || '—'}</td>
                  <td>
                    {d.dnsRecords && d.dnsRecords.length > 0 ? (
                      <>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                        >
                          {d.dnsRecords.length} kayıt {expandedId === d.id ? '(gizle)' : '(göster)'}
                        </button>
                        {expandedId === d.id && (
                          <div className="dns-records-inline">
                            {d.dnsRecords.map((r, i) => (
                              <div key={i} className="dns-record-line">
                                <span className="dns-type">{r.type}</span>
                                {r.name && <span className="dns-name">{r.name}</span>}
                                <span className="dns-value">{r.value}</span>
                                {r.priority != null && <span className="dns-priority">MX {r.priority}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <button type="button" onClick={() => openEdit(d)}>
                      Düzenle
                    </button>
                    <button type="button" onClick={() => handleDelete(d.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDomains.length === 0 && (
            <p className="muted">Henüz alan adı eklenmemiş veya arama kriterlerine uyan kayıt yok.</p>
          )}
        </div>
      )}

      {deleteConfirmId && (
        <div className="confirm-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <p>Bu alan adını silmek istediğinize emin misiniz? DNS kayıtları da silinecektir.</p>
            <> "DNS Kayıtlarının tamamı vercel dns kaydı olan ns1.vercel-dns.com, ns2.vercel-dns.com adreslerine yönlendirilmiştir." </>
                        <div className="confirm-actions">
              <button type="button" className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>
                İptal
              </button>
              <button type="button" className="btn-danger" onClick={confirmDelete}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Alan Adını Düzenle' : 'Yeni Alan Adı'}</h3>
            {error && modalOpen && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                Alan adı *
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="ornek.com"
                  required
                />
              </label>
              <label>
                Site (opsiyonel)
                <select
                  value={form.siteId}
                  onChange={(e) => setForm((f) => ({ ...f, siteId: e.target.value }))}
                >
                  <option value="">— Seçin —</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-row">
                <label>
                  Son kullanma tarihi
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  />
                </label>
                <label>
                  Kayıt sağlayıcı
                  <input
                    type="text"
                    value={form.registrar}
                    onChange={(e) => setForm((f) => ({ ...f, registrar: e.target.value }))}
                    placeholder="GoDaddy, Namecheap, vb."
                  />
                </label>
              </div>
              <label>
                Notlar
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Notlar…"
                />
              </label>

              <div className="dns-section">
                <div className="dns-section-header">
                  <span>DNS kayıtları</span>
                  <button type="button" className="btn-secondary btn-small" onClick={addDnsRow}>
                    + Kayıt ekle
                  </button>
                </div>
                <div className="dns-records-editor">
                  {(form.dnsRecords || []).map((row, index) => (
                    <div key={index} className="dns-record-row">
                      <select
                        value={row.type}
                        onChange={(e) => updateDnsRow(index, 'type', e.target.value)}
                        className="dns-type-select"
                      >
                        {DNS_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateDnsRow(index, 'name', e.target.value)}
                        placeholder="Host (@, www, mail…)"
                        className="dns-name-input"
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => updateDnsRow(index, 'value', e.target.value)}
                        placeholder="Değer"
                        className="dns-value-input"
                      />
                      {row.type === 'MX' && (
                        <input
                          type="number"
                          value={row.priority ?? ''}
                          onChange={(e) =>
                            updateDnsRow(index, 'priority', e.target.value === '' ? null : e.target.value)
                          }
                          placeholder="Öncelik"
                          className="dns-priority-input"
                          min="0"
                        />
                      )}
                      <input
                        type="number"
                        value={row.ttl ?? 3600}
                        onChange={(e) => updateDnsRow(index, 'ttl', e.target.value ? Number(e.target.value) : 3600)}
                        placeholder="TTL"
                        className="dns-ttl-input"
                        min="60"
                      />
                      <button
                        type="button"
                        className="btn-remove-row"
                        onClick={() => removeDnsRow(index)}
                        title="Kaydı kaldır"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

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
