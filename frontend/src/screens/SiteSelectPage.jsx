import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSites } from '../api/client'
import { logoUrl } from '../utils/logoUrl'
import { normalizePublicUrl, siteAdminDashboardPath } from '../utils/siteUrls'
import MainLogo from '../components/MainLogo'

function SiteCard({ site, logoUrl: getUrl, onOpenAdmin }) {
  const [imgFailed, setImgFailed] = useState(false)
  const letter = (site.name || '?').charAt(0).toUpperCase()
  const src = site.logo ? (site.logo.startsWith('http') ? site.logo : getUrl(site.logo)) : ''
  const rawPublic =
    site.publicUrl != null && site.publicUrl !== ''
      ? String(site.publicUrl)
      : site.public_url != null
        ? String(site.public_url)
        : ''
  const webHref = normalizePublicUrl(rawPublic)
  const hasWeb = Boolean(webHref)

  const openWebsite = () => {
    if (!webHref) return
    const opened = window.open(webHref, '_blank', 'noopener,noreferrer')
    if (opened) opened.opener = null
  }

  return (
    <div className="site-card">
      <div className="site-card-brand">
        <div className="site-logo-wrapper">
          {!imgFailed && src && (
            <img
              src={src}
              alt=""
              className="site-logo"
              onError={() => setImgFailed(true)}
            />
          )}
          {(imgFailed || !src) && (
            <span className="site-logo-letter" aria-hidden>{letter}</span>
          )}
        </div>
        <div className="site-name">{site.name}</div>
      </div>
      <div className="site-card-actions">
        {hasWeb ? (
          <button
            type="button"
            className="site-card-btn site-card-btn--web"
            onClick={openWebsite}
          >
            Web sitesi
          </button>
        ) : (
          <span
            className="site-card-btn site-card-btn--web site-card-btn--disabled"
            title="Site ayarlarından “Genel web adresi” ekleyin"
          >
            Web sitesi
          </span>
        )}
        <button
          type="button"
          className="site-card-btn site-card-btn--admin"
          onClick={() => onOpenAdmin(site.id)}
        >
          Yönetim paneli
        </button>
      </div>
    </div>
  )
}

export default function SiteSelectPage() {
  const navigate = useNavigate()
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getSites()
      .then(setSites)
      .catch((err) => setError(err.message || 'Siteler yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  const handleOpenAdmin = (siteId) => {
    navigate(siteAdminDashboardPath(siteId))
  }

  const selectItems = sites.map((site) => ({
    site,
    selectId: site.id,
  }))

  if (loading) return (
    <div className="site-select-page">
      <MainLogo variant="white" animated />
      <p>Yükleniyor…</p>
    </div>
  )
  if (error) return (
    <div className="site-select-page">
      <MainLogo variant="white" animated />
      <p className="auth-error">{error}</p>
    </div>
  )

  return (
    <div className="site-select-page">
      <MainLogo variant="white" animated />
      <h1>Siteler</h1>
      <p>
        Her site için <strong>Web sitesi</strong> canlı adrese, <strong>Yönetim paneli</strong> ise bu
        paneldeki site yönetimine gider. Web adresi boşsa önce ilgili sitede{' '}
        <em>Ayarlar</em> bölümünden URL girin.
      </p>
      <div className="site-grid">
        {selectItems.map(({ site, selectId }) => (
          <SiteCard
            key={selectId}
            site={site}
            onOpenAdmin={handleOpenAdmin}
            logoUrl={logoUrl}
          />
        ))}
      </div>
    </div>
  )
}
