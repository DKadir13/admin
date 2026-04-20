import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDomains } from '../api/client'

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

export default function DomainExpiryBanner() {
  const [domains, setDomains] = useState([])

  useEffect(() => {
    getDomains()
      .then((list) => setDomains(Array.isArray(list) ? list : []))
      .catch(() => setDomains([]))
  }, [])

  const withExpiry = domains
    .filter((d) => d.expiryDate)
    .map((d) => ({ ...d, daysLeft: getDaysLeft(d.expiryDate) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)

  if (withExpiry.length === 0) return null

  return (
    <div className="domain-expiry-banner-wrap">
      {withExpiry.map((d) => {
        const variant = getAlertVariant(d.daysLeft)
        const daysText = d.daysLeft < 0
          ? `${Math.abs(d.daysLeft)} gün önce bitti`
          : d.daysLeft === 0
            ? 'Bugün bitiyor'
            : `${d.daysLeft} gün kaldı`
        return (
          <div key={d.id} className={`domain-expiry-banner domain-expiry-banner--${variant}`}>
            <span className="domain-expiry-banner-domain">{d.name}</span>
            <span className="domain-expiry-banner-text">
              Bu tarihte bitecektir: <strong>{formatExpiryDate(d.expiryDate)}</strong>
              <span className="domain-expiry-banner-days"> ({daysText})</span>
            </span>
            <Link to="domains" className="domain-expiry-banner-link">Alan adları →</Link>
          </div>
        )
      })}
    </div>
  )
}
