import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_BASE, getSites, getStats, getBlog, getProducts, getDomains, getActivity, exportProducts, exportBlog, getAnnouncements, getQuickLinks, logout as apiLogout } from '../api/client'
import { logoUrl } from '../utils/logoUrl'
import MainLogo from '../components/MainLogo'
import ThemeToggle from '../components/ThemeToggle'

const imageSrc = (path) => (!path ? '' : path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`)

const MS_PER_DAY = 24 * 60 * 60 * 1000

function formatExpiryDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getDaysLeft(expiryDate) {
  const now = Date.now()
  const exp = new Date(expiryDate).getTime()
  return Math.ceil((exp - now) / MS_PER_DAY)
}

function getAlertVariant(daysLeft) {
  if (daysLeft <= 7) return 'red'
  if (daysLeft <= 30) return 'orange'
  return 'green'
}

export default function MainDashboardPage() {
  const navigate = useNavigate()
  const [sites, setSites] = useState([])
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [posts, setPosts] = useState([])
  const [products, setProducts] = useState([])
  const [domains, setDomains] = useState([])
  const [loadingSites, setLoadingSites] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [activity, setActivity] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [exporting, setExporting] = useState('')
  const [internalAnnouncements, setInternalAnnouncements] = useState([])
  const [internalQuickLinks, setInternalQuickLinks] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getSites()
      .then((list) => setSites(Array.isArray(list) ? list : []))
      .catch((err) => setError(err.message || 'Siteler yüklenemedi.'))
      .finally(() => setLoadingSites(false))
  }, [])

  const loadStats = () => {
    setLoadingStats(true)
    setStatsError('')
    getStats()
      .then((data) => {
        setStats(data || null)
        setStatsError('')
      })
      .catch((err) => {
        setStats(null)
        setStatsError(err.message || 'İstatistikler yüklenemedi.')
      })
      .finally(() => setLoadingStats(false))
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    setLoadingActivity(true)
    getActivity()
      .then((list) => setActivity(Array.isArray(list) ? list : []))
      .catch(() => setActivity([]))
      .finally(() => setLoadingActivity(false))
  }, [])

  useEffect(() => {
    getAnnouncements(selectedSiteId || undefined)
      .then((list) => setInternalAnnouncements(Array.isArray(list) ? list.slice(0, 3) : []))
      .catch(() => setInternalAnnouncements([]))
    getQuickLinks()
      .then((list) => setInternalQuickLinks(Array.isArray(list) ? list.slice(0, 5) : []))
      .catch(() => setInternalQuickLinks([]))
  }, [selectedSiteId])

  useEffect(() => {
    if (!selectedSiteId) {
      setPosts([])
      setProducts([])
      return
    }
    setLoadingData(true)
    setError('')
    Promise.all([getBlog(selectedSiteId), getProducts(selectedSiteId)])
      .then(([p, pr]) => {
        setPosts(Array.isArray(p) ? p : [])
        setProducts(Array.isArray(pr) ? pr : [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingData(false))
  }, [selectedSiteId])

  useEffect(() => {
    getDomains()
      .then((list) => setDomains(Array.isArray(list) ? list : []))
      .catch(() => setDomains([]))
  }, [])

  const handleExport = async (siteId, type) => {
    const key = `${siteId}-${type}`
    setExporting(key)
    try {
      const data = type === 'products' ? await exportProducts(siteId) : await exportBlog(siteId)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type === 'products' ? 'urunler' : 'blog'}-${siteId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (_) {}
    setExporting('')
  }

  const handleLogout = async () => {
    await apiLogout()
    window.localStorage.removeItem('admin_token')
    window.localStorage.removeItem('admin_auth')
    navigate('/login')
  }

  const published = posts.filter((p) => p.status === 'yayında')
  const draft = posts.filter((p) => p.status === 'taslak')
  const activeProducts = products.filter((p) => p.status === 'aktif')

  const siteDomains = selectedSiteId
    ? domains.filter((d) => d.expiryDate && (d.siteId === selectedSiteId || !d.siteId))
    : []
  const siteDomainsWithDays = siteDomains
    .map((d) => ({ ...d, daysLeft: getDaysLeft(d.expiryDate) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)

  return (
    <div className="main-dashboard">
      <header className="main-dashboard-header">
        <div className="main-dashboard-logo">
          <MainLogo variant="white" />
        </div>
        <h1 className="main-dashboard-title">Dashboard</h1>
        <Link to="/internal" className="main-dashboard-internal-link">Şirket içi</Link>
        <ThemeToggle />
        <button type="button" className="main-dashboard-logout" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </header>

      <div className="main-dashboard-content">
        {error && <div className="auth-error">{error}</div>}

        {/* Tüm siteler özeti — toplam kaç blog, ürün, yazı eklenmiş, kaç MB dosya */}
        {!loadingSites && sites.length > 0 && (
          <section className="dashboard-overview-section">
            <h2 className="dashboard-overview-title">Tüm siteler özeti</h2>
            <p className="dashboard-overview-desc">Panelde toplam kaç blog yazısı, ürün ve alan adı eklendiği ile yüklenen dosyaların boyutu aşağıdadır.</p>
            {loadingStats ? (
              <p className="muted">İstatistikler yükleniyor…</p>
            ) : (
              <>
                {statsError && (
                  <div className="auth-error dashboard-overview-error">
                    {statsError}
                    <button type="button" className="dashboard-overview-retry" onClick={loadStats}>Yenile</button>
                  </div>
                )}
                <div className="dashboard-stats dashboard-stats--overview">
                  <div className="stat-card">
                    <span className="stat-value">{stats?.totalSites ?? 0}</span>
                    <span className="stat-label">Toplam site</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats?.totalProducts ?? 0}</span>
                    <span className="stat-label">Toplam ürün</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats?.totalProductsActive ?? 0}</span>
                    <span className="stat-label">Aktif ürün</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats?.totalProductsPassive ?? 0}</span>
                    <span className="stat-label">Pasif ürün</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats?.totalBlogPosts ?? 0}</span>
                    <span className="stat-label">Toplam blog yazısı</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats?.totalBlogPublished ?? 0}</span>
                    <span className="stat-label">Yayında (blog)</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats?.totalBlogDraft ?? 0}</span>
                    <span className="stat-label">Taslak (blog)</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats?.totalDomains ?? 0}</span>
                    <span className="stat-label">Toplam alan adı</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">
                      {stats?.uploadsFileCount != null ? `${stats.uploadsFileCount} dosya` : '—'}
                      {stats?.uploadsFileCount != null && stats?.uploadsSizeMB != null ? ', ' : ''}
                      {stats?.uploadsSizeMB != null ? `${stats.uploadsSizeMB} MB` : ''}
                    </span>
                    <span className="stat-label">Yüklenen dosyalar</span>
                  </div>
                </div>
                {stats?.bySite && stats.bySite.length > 0 && (
                  <div className="dashboard-overview-table-wrap">
                    <h3 className="dashboard-overview-subtitle">Site bazında</h3>
                    <table className="data-table dashboard-overview-table">
                      <thead>
                        <tr>
                          <th>Site / Firma</th>
                          <th>Ürün</th>
                          <th>Blog yazısı</th>
                          <th>Alan adı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.bySite.map((row) => (
                          <tr key={row.siteId}>
                            <td><strong>{row.siteName}</strong></td>
                            <td>{row.products}</td>
                            <td>{row.blogPosts}</td>
                            <td>{row.domains ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(stats.totalDomainsNoSite ?? 0) > 0 && (
                      <p className="dashboard-overview-extra muted">
                        Site atanmamış alan adı: {stats.totalDomainsNoSite}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {!loadingSites && sites.length > 0 && (
          <section className="dashboard-overview-section dashboard-activity-section">
            <h2 className="dashboard-overview-title">Son işlemler</h2>
            {loadingActivity ? (
              <p className="muted">Yükleniyor…</p>
            ) : activity.length === 0 ? (
              <p className="muted">Henüz kayıt yok.</p>
            ) : (
              <ul className="activity-log-list">
                {activity.slice(0, 20).map((item) => (
                  <li key={item.id} className="activity-log-item">
                    <span className={`activity-log-badge activity-log-badge--${item.type}`}>{item.type === 'product' ? 'Ürün' : item.type === 'blog' ? 'Blog' : item.type}</span>
                    <span className="activity-log-action">{item.action === 'create' ? 'Eklendi' : item.action === 'update' ? 'Güncellendi' : 'Silindi'}</span>
                    <span className="activity-log-label">{item.label}</span>
                    {item.siteId && <span className="activity-log-site muted">({item.siteId})</span>}
                    <span className="activity-log-date muted">{item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!loadingSites && (
          <section className="dashboard-internal-preview">
            <h2 className="dashboard-overview-title">Şirket içi</h2>
            <p className="dashboard-overview-desc">Duyurular, hızlı linkler ve notlar. Sadece panel kullanıcıları görür.</p>
            <div className="dashboard-internal-preview-content">
              {internalAnnouncements.length > 0 && (
                <div className="dashboard-internal-block">
                  <strong>Son duyurular</strong>
                  <ul className="dashboard-internal-list">
                    {internalAnnouncements.map((a) => (
                      <li key={a.id}>{a.title}</li>
                    ))}
                  </ul>
                </div>
              )}
              {internalQuickLinks.length > 0 && (
                <div className="dashboard-internal-block">
                  <strong>Hızlı linkler</strong>
                  <div className="dashboard-internal-links">
                    {internalQuickLinks.map((l) => (
                      <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="dashboard-internal-link">{l.label}</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link to="/internal" className="dashboard-internal-cta">Şirket içi araçlar →</Link>
          </section>
        )}

        {loadingSites ? (
          <p>Yükleniyor…</p>
        ) : sites.length === 0 ? (
          <p className="muted">Henüz site tanımlanmamış.</p>
        ) : selectedSiteId ? (
          <>
            {siteDomainsWithDays.length > 0 && (
              <div className="main-dashboard-domain-alerts">
                {siteDomainsWithDays.slice(0, 3).map((d) => {
                  const variant = getAlertVariant(d.daysLeft)
                  const daysText = d.daysLeft < 0 ? `${Math.abs(d.daysLeft)} gün önce bitti` : d.daysLeft === 0 ? 'Bugün bitiyor' : `${d.daysLeft} gün kaldı`
                  return (
                    <div key={d.id} className={`domain-expiry-banner domain-expiry-banner--${variant}`}>
                      <span className="domain-expiry-banner-domain">{d.name}</span>
                      <span className="domain-expiry-banner-text">
                        Bu tarihte bitecektir: <strong>{formatExpiryDate(d.expiryDate)}</strong>
                        <span className="domain-expiry-banner-days"> ({daysText})</span>
                      </span>
                      <Link to={`/sites/${selectedSiteId}/domains`} className="domain-expiry-banner-link">Alan adları →</Link>
                    </div>
                  )
                })}
              </div>
            )}

            {loadingData ? (
              <p>Site verileri yükleniyor…</p>
            ) : (
              <>
                <div className="dashboard-stats">
                  <div className="stat-card">
                    <span className="stat-value">{posts.length}</span>
                    <span className="stat-label">Toplam yazı</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{published.length}</span>
                    <span className="stat-label">Yayında (blog)</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{products.length}</span>
                    <span className="stat-label">Toplam ürün</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{activeProducts.length}</span>
                    <span className="stat-label">Aktif ürün</span>
                  </div>
                </div>

                <div className="dashboard-section">
                  <h3>Son blog yazıları</h3>
                  <Link to={`/sites/${selectedSiteId}/blog`} className="dashboard-link">Tümünü yönet →</Link>
                  {posts.length === 0 ? (
                    <p className="muted">Henüz blog yazısı yok.</p>
                  ) : (
                    <ul className="blog-preview-list">
                      {posts.slice(0, 8).map((post) => (
                        <li key={post.id} className="blog-preview-item">
                          {post.image && (
                            <div className="blog-preview-img">
                              <img src={imageSrc(post.image)} alt="" />
                            </div>
                          )}
                          <div className="blog-preview-body">
                            <strong>{post.title}</strong>
                            <span className="blog-preview-meta">
                              {post.displayDates?.length > 0
                                ? post.displayDates.map((d) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })).join(', ')
                                : post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('tr-TR') : '—'} · {post.status}
                            </span>
                            {post.content && <p className="blog-preview-excerpt">{post.content.slice(0, 100)}{post.content.length > 100 ? '…' : ''}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="dashboard-section">
                  <h3>Son ürünler</h3>
                  <Link to={`/sites/${selectedSiteId}/products`} className="dashboard-link">Tümünü yönet →</Link>
                  {products.length === 0 ? (
                    <p className="muted">Henüz ürün yok.</p>
                  ) : (
                    <ul className="blog-preview-list">
                      {products.slice(0, 8).map((product) => (
                        <li key={product.id} className="blog-preview-item">
                          {product.image && (
                            <div className="blog-preview-img">
                              <img src={imageSrc(product.image)} alt="" />
                            </div>
                          )}
                          <div className="blog-preview-body">
                            <strong>{product.name}</strong>
                            <span className="blog-preview-meta">{product.price || '—'} · {product.status}</span>
                            {product.description && <p className="blog-preview-excerpt">{product.description.slice(0, 100)}{product.description.length > 100 ? '…' : ''}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="muted dashboard-select-hint">Aşağıdan bir firma seçerek o siteye ait son yazı ve ürünleri görebilirsiniz.</p>
        )}
      </div>

      <footer className="main-dashboard-footer">
        <div className="main-dashboard-firm-select">
          <span className="main-dashboard-firm-label">Firma seçin</span>
          <div className="main-dashboard-firm-cards">
            {sites.map((site) => {
              const logoSrc = site.logo ? (site.logo.startsWith('http') ? site.logo : logoUrl(site.logo)) : ''
              return (
                <button
                  key={site.id}
                  type="button"
                  className={`main-dashboard-firm-card ${selectedSiteId === site.id ? 'main-dashboard-firm-card--selected' : ''}`}
                  onClick={() => setSelectedSiteId(site.id)}
                >
                  <span className="main-dashboard-firm-logo-wrap">
                    <span className="main-dashboard-firm-letter" aria-hidden>{(site.name || '?').charAt(0)}</span>
                    {logoSrc && <img src={logoSrc} alt="" className="main-dashboard-firm-logo" onError={(e) => { e.target.style.display = 'none' }} />}
                  </span>
                  <span className="main-dashboard-firm-name">{site.name}</span>
                </button>
              )
            })}
          </div>
          <div className="main-dashboard-footer-actions">
            {selectedSiteId && (
              <Link to={`/sites/${selectedSiteId}`} className="main-dashboard-btn main-dashboard-btn--primary">
                Bu sitenin yönetimine git
              </Link>
            )}
            <Link to="/sites" className="main-dashboard-btn main-dashboard-btn--secondary">
              Tüm siteler
            </Link>
          </div>
          <div className="main-dashboard-export">
            <span className="main-dashboard-export-title">Dışa aktar (JSON)</span>
            <div className="main-dashboard-export-buttons">
              {sites.map((site) => (
                <span key={site.id} className="main-dashboard-export-site">
                  <strong>{site.name}</strong>
                  <button type="button" className="btn-export" onClick={() => handleExport(site.id, 'products')} disabled={!!exporting}>
                    {exporting === `${site.id}-products` ? '…' : 'Ürünler'}
                  </button>
                  <button type="button" className="btn-export" onClick={() => handleExport(site.id, 'blog')} disabled={!!exporting}>
                    {exporting === `${site.id}-blog` ? '…' : 'Blog'}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
