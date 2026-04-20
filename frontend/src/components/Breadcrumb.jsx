import { Link, useLocation } from 'react-router-dom'

const LABELS = {
  dashboard: 'Genel Bakış',
  blog: 'Blog Yazıları',
  events: 'Etkinlikler',
  products: 'Ürünler',
  domains: 'Alan Adları',
  settings: 'Site Ayarları',
}

export default function Breadcrumb({ siteName }) {
  const location = useLocation()
  const path = location.pathname
  const parts = path.split('/').filter(Boolean)
  const siteId = parts[1]
  const page = parts[2] || 'dashboard'

  if (!siteId) return null

  const currentLabel = LABELS[page] || page

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link to="/sites">Siteler</Link>
      <span aria-hidden>/</span>
      <Link to={`/sites/${siteId}`}>{siteName || siteId}</Link>
      <span aria-hidden>/</span>
      <span>{currentLabel}</span>
    </nav>
  )
}
