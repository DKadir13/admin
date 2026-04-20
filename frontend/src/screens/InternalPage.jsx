import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getQuickLinks,
  createQuickLink,
  updateQuickLink,
  deleteQuickLink,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getSites,
} from '../api/client'
import { useToast } from '../context/ToastContext'

export default function InternalPage() {
  const [sites, setSites] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [quickLinks, setQuickLinks] = useState([])
  const [notes, setNotes] = useState([])
  const [noteSiteFilter, setNoteSiteFilter] = useState('') // '' = genel notlar
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('announcements')
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', siteId: '' })
  const [quickLinkForm, setQuickLinkForm] = useState({ label: '', url: '' })
  const [noteForm, setNoteForm] = useState({ title: '', content: '', siteId: '' })
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const load = () => {
    setLoading(true)
    Promise.all([
      getSites().then(setSites).catch(() => setSites([])),
      getAnnouncements().then(setAnnouncements).catch(() => setAnnouncements([])),
      getQuickLinks().then(setQuickLinks).catch(() => setQuickLinks([])),
      getNotes(noteSiteFilter).then(setNotes).catch(() => setNotes([])),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { getNotes(noteSiteFilter).then(setNotes).catch(() => setNotes([])) }, [noteSiteFilter])

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault()
    if (!announcementForm.title.trim()) return
    setSaving(true)
    try {
      await createAnnouncement(announcementForm)
      setAnnouncementForm({ title: '', body: '', siteId: '' })
      load()
      showToast('Duyuru eklendi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally { setSaving(false) }
  }

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault()
    if (!editingId || !announcementForm.title.trim()) return
    setSaving(true)
    try {
      await updateAnnouncement(editingId, announcementForm)
      setEditingId(null)
      setAnnouncementForm({ title: '', body: '', siteId: '' })
      load()
      showToast('Duyuru güncellendi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally { setSaving(false) }
  }

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return
    try {
      await deleteAnnouncement(id)
      load()
      showToast('Duyuru silindi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateQuickLink = async (e) => {
    e.preventDefault()
    if (!quickLinkForm.label.trim() || !quickLinkForm.url.trim()) return
    setSaving(true)
    try {
      await createQuickLink(quickLinkForm)
      setQuickLinkForm({ label: '', url: '' })
      load()
      showToast('Link eklendi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally { setSaving(false) }
  }

  const handleDeleteQuickLink = async (id) => {
    try {
      await deleteQuickLink(id)
      load()
      showToast('Link silindi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateNote = async (e) => {
    e.preventDefault()
    if (!noteForm.title.trim()) return
    setSaving(true)
    try {
      await createNote({ title: noteForm.title, content: noteForm.content || '', siteId: noteSiteFilter || '' })
      setNoteForm({ title: '', content: '', siteId: noteSiteFilter })
      load()
      getNotes(noteSiteFilter).then(setNotes).catch(() => {})
      showToast('Not eklendi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally { setSaving(false) }
  }

  const handleUpdateNote = async (id, body) => {
    try {
      await updateNote(id, body)
      getNotes(noteSiteFilter).then(setNotes).catch(() => {})
      showToast('Not güncellendi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteNote = async (id) => {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return
    try {
      await deleteNote(id)
      getNotes(noteSiteFilter).then(setNotes).catch(() => setNotes([]))
      showToast('Not silindi.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (loading && announcements.length === 0 && quickLinks.length === 0) {
    return <div className="internal-page"><p>Yükleniyor…</p></div>
  }

  return (
    <div className="internal-page">
      <div className="internal-header">
        <h1>Şirket içi araçlar</h1>
        <p className="muted">Duyurular, hızlı linkler ve notlar — sadece panel kullanıcıları görür.</p>
        <Link to="/dashboard" className="internal-back">← Dashboard</Link>
      </div>

      <div className="internal-tabs">
        <button type="button" className={tab === 'announcements' ? 'active' : ''} onClick={() => setTab('announcements')}>Duyurular</button>
        <button type="button" className={tab === 'links' ? 'active' : ''} onClick={() => setTab('links')}>Hızlı linkler</button>
        <button type="button" className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>Notlar</button>
      </div>

      {tab === 'announcements' && (
        <section className="internal-section">
          <h2>Duyurular</h2>
          <form onSubmit={editingId ? handleUpdateAnnouncement : handleCreateAnnouncement} className="internal-form">
            <input
              type="text"
              placeholder="Duyuru başlığı"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <textarea
              placeholder="Metin (isteğe bağlı)"
              value={announcementForm.body}
              onChange={(e) => setAnnouncementForm((f) => ({ ...f, body: e.target.value }))}
              rows={2}
            />
            <select
              value={announcementForm.siteId}
              onChange={(e) => setAnnouncementForm((f) => ({ ...f, siteId: e.target.value }))}
            >
              <option value="">Tüm panel</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="internal-form-actions">
              <button type="submit" disabled={saving}>{editingId ? 'Güncelle' : 'Ekle'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setAnnouncementForm({ title: '', body: '', siteId: '' }) }}>İptal</button>}
            </div>
          </form>
          <ul className="internal-list">
            {announcements.map((a) => (
              <li key={a.id} className="internal-list-item">
                <div className="internal-list-item-head">
                  <strong>{a.title}</strong>
                  <span className="muted">{a.siteId ? `${sites.find((s) => s.id === a.siteId)?.name || a.siteId}` : 'Tüm panel'}</span>
                  <span className="muted internal-date">{a.createdAt ? new Date(a.createdAt).toLocaleString('tr-TR') : ''}</span>
                </div>
                {a.body && <p className="internal-list-item-body">{a.body}</p>}
                <div className="internal-list-item-actions">
                  <button type="button" onClick={() => { setEditingId(a.id); setAnnouncementForm({ title: a.title, body: a.body || '', siteId: a.siteId || '' }) }}>Düzenle</button>
                  <button type="button" className="btn-danger-inline" onClick={() => handleDeleteAnnouncement(a.id)}>Sil</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'links' && (
        <section className="internal-section">
          <h2>Hızlı linkler</h2>
          <p className="muted">Sık kullandığınız şirket içi sayfalar (intranet, dosya, form vb.).</p>
          <form onSubmit={handleCreateQuickLink} className="internal-form internal-form-inline">
            <input
              type="text"
              placeholder="Etiket (örn: İnsan Kaynakları)"
              value={quickLinkForm.label}
              onChange={(e) => setQuickLinkForm((f) => ({ ...f, label: e.target.value }))}
              required
            />
            <input
              type="url"
              placeholder="https://..."
              value={quickLinkForm.url}
              onChange={(e) => setQuickLinkForm((f) => ({ ...f, url: e.target.value }))}
              required
            />
            <button type="submit" disabled={saving}>Link ekle</button>
          </form>
          <div className="quick-links-grid">
            {quickLinks.map((l) => (
              <div key={l.id} className="quick-link-card">
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="quick-link-card-link">{l.label}</a>
                <button type="button" className="quick-link-remove" onClick={() => handleDeleteQuickLink(l.id)} title="Kaldır">×</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'notes' && (
        <section className="internal-section">
          <h2>Notlar</h2>
          <div className="internal-notes-filter">
            <span>Göster: </span>
            <button type="button" className={noteSiteFilter === '' ? 'active' : ''} onClick={() => setNoteSiteFilter('')}>Genel notlar</button>
            {sites.map((s) => (
              <button key={s.id} type="button" className={noteSiteFilter === s.id ? 'active' : ''} onClick={() => setNoteSiteFilter(s.id)}>{s.name}</button>
            ))}
          </div>
          <form onSubmit={handleCreateNote} className="internal-form">
            <input
              type="text"
              placeholder="Not başlığı"
              value={noteForm.title}
              onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <textarea
              placeholder="İçerik (isteğe bağlı)"
              value={noteForm.content}
              onChange={(e) => setNoteForm((f) => ({ ...f, content: e.target.value }))}
              rows={3}
            />
            <button type="submit" disabled={saving}>Not ekle ({(noteSiteFilter ? sites.find((s) => s.id === noteSiteFilter)?.name : 'Genel')} notlarına)</button>
          </form>
          <ul className="internal-list">
            {notes.map((n) => (
              <li key={n.id} className="internal-list-item">
                <div className="internal-list-item-head">
                  <strong>{n.title}</strong>
                  <span className="muted internal-date">{n.updatedAt ? new Date(n.updatedAt).toLocaleString('tr-TR') : ''}</span>
                </div>
                {n.content && <p className="internal-list-item-body">{n.content}</p>}
                <div className="internal-list-item-actions">
                  <button type="button" className="btn-danger-inline" onClick={() => handleDeleteNote(n.id)}>Sil</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
