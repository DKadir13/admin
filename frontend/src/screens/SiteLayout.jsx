import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { getSite } from '../api/client'
import { logout as apiLogout } from '../api/client'
import { logoUrl } from '../utils/logoUrl'
import Breadcrumb from '../components/Breadcrumb'
import DomainExpiryBanner from '../components/DomainExpiryBanner'
import DataFetchCodeBlock from '../components/DataFetchCodeBlock'
import ThemeToggle from '../components/ThemeToggle'

export default function SiteLayout() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSite(siteId)
      .then((data) => setSite(data || null))
      .catch(() => setSite(null))
      .finally(() => setLoading(false))
  }, [siteId])

  const handleLogout = async () => {
    await apiLogout()
    navigate('/dashboard')
  }

  if (loading) return <div className="site-content">Yükleniyor…</div>
  if (!site) {
    return <div className="site-content">Böyle bir site bulunamadı.</div>
  }

  const handleBackToSites = () => {
    navigate('/sites')
  }

  return (
    <div className="site-layout">
      <aside className="site-sidebar">
        <div className="site-sidebar-header">
          <button type="button" className="back-button" onClick={handleBackToSites}>
            ← Tüm Siteler
          </button>
          <div className="site-info">
            <img src={logoUrl(site.logo)} alt={site.name} className="site-logo-small" />
            <div>
              <div className="site-title">{site.name}</div>
              <div className="site-subtitle">Yönetim Paneli</div>
            </div>
          </div>
        </div>
        <div className="site-sidebar-theme">
          <ThemeToggle />
        </div>
        <nav className="site-nav">
          <NavLink to="dashboard" className="nav-link">
            Genel Bakış
          </NavLink>
          <NavLink to="blog" className="nav-link">
            Blog Yazıları
          </NavLink>
          <NavLink to="events" className="nav-link">
            Etkinlikler
          </NavLink>
          <NavLink to="products" className="nav-link">
            Ürünler
          </NavLink>
          <NavLink to="domains" className="nav-link">
            Alan Adları
          </NavLink>
          <NavLink to="settings" className="nav-link">
            Site Ayarları
          </NavLink>
        </nav>
        <div className="site-sidebar-footer">
          <button type="button" className="logout-button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </aside>
      <main className="site-content">
        <DomainExpiryBanner />
        <Breadcrumb siteName={site.name} />
        <Outlet />
        <DataFetchCodeBlock siteId={site.id} />
      </main>
    </div>
  )
}

