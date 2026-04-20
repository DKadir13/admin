import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSite, updateSite } from '../api/client'
import { useToast } from '../context/ToastContext'

export default function SiteSettingsPage() {
  const { siteId } = useParams()
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    logo: '',
    publicUrl: '',
    apiBaseUrl: '',
    primaryColor: '',
    secondaryColor: '',
    maintenanceMode: false,
    blogEnabled: true,
  })
  const { showToast } = useToast()

  useEffect(() => {
    if (!siteId) return
    setLoading(true)
    getSite(siteId)
      .then((data) => {
        setSite(data)
        setForm({
          name: data.name || '',
          logo: data.logo || '',
          publicUrl: data.publicUrl || '',
          apiBaseUrl: data.apiBaseUrl || '',
          primaryColor: data.primaryColor || '',
          secondaryColor: data.secondaryColor || '',
          maintenanceMode: !!data.maintenanceMode,
          blogEnabled: data.blogEnabled !== undefined ? !!data.blogEnabled : true,
        })
      })
      .catch(() => showToast('Site yüklenemedi.', 'error'))
      .finally(() => setLoading(false))
  }, [siteId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!siteId) return
    setSaving(true)
    try {
      await updateSite(siteId, {
        name: form.name,
        logo: form.logo,
        publicUrl: form.publicUrl,
        apiBaseUrl: form.apiBaseUrl,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        maintenanceMode: form.maintenanceMode,
        blogEnabled: form.blogEnabled,
      })
      setSite((s) => (s ? { ...s, ...form } : s))
      showToast('Site ayarları kaydedildi.', 'success')
    } catch (err) {
      showToast(err.message || 'Kaydedilemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !site) return <div className="site-content">Yükleniyor…</div>

  return (
    <div className="site-settings-page">
      <h1>Site ayarları</h1>
      <p className="muted">Site adı, logo, tema renkleri ve bakım modu. Front sitelerde kullanılır.</p>
      <form onSubmit={handleSubmit} className="site-settings-form">
        <label>
          Site adı
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Örn: Medart İlaç"
          />
        </label>
        <label>
          Logo URL
          <input
            type="text"
            value={form.logo}
            onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
            placeholder="/logolar/logo.png veya tam URL"
          />
        </label>
        <label>
          Genel web adresi (canlı / önizleme)
          <input
            type="text"
            value={form.publicUrl}
            onChange={(e) => setForm((f) => ({ ...f, publicUrl: e.target.value }))}
            placeholder="https://www.ornek.com veya localhost:5173"
          />
          <span className="muted" style={{ display: 'block', marginTop: 6, fontSize: 13 }}>
            “Siteler” sayfasındaki <strong>Web sitesi</strong> butonu bu adrese gider.
          </span>
        </label>
        <label>
          API base URL (opsiyonel)
          <input
            type="text"
            value={form.apiBaseUrl}
            onChange={(e) => setForm((f) => ({ ...f, apiBaseUrl: e.target.value }))}
            placeholder="https://..."
          />
        </label>
        <div className="site-settings-colors">
          <label>
            Ana renk (hex)
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              placeholder="#2563eb"
            />
          </label>
          <label>
            İkincil renk (hex)
            <input
              type="text"
              value={form.secondaryColor}
              onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
              placeholder="#64748b"
            />
          </label>
        </div>
        <label className="site-settings-checkbox">
          <input
            type="checkbox"
            checked={form.maintenanceMode}
            onChange={(e) => setForm((f) => ({ ...f, maintenanceMode: e.target.checked }))}
          />
          Bakım modu (açıkken front sitede “Bakımdayız” gösterilebilir)
        </label>
        <label className="site-settings-checkbox">
          <input
            type="checkbox"
            checked={form.blogEnabled}
            onChange={(e) => setForm((f) => ({ ...f, blogEnabled: e.target.checked }))}
          />
          Blog sayfası / blog linki görünsün (aktif-yazılar yoksa zaten görünmeyecektir)
        </label>
        <div className="modal-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
