import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBlog, getProducts } from '../api/client'

const imageSrc = (path) => {
  if (!path) return ''
  if (String(path).startsWith('http')) return path
  return String(path).startsWith('/') ? String(path) : `/${path}`
}

export default function DashboardPage() {
  const { siteId } = useParams()
  const [posts, setPosts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([getBlog(siteId), getProducts(siteId)])
      .then(([p, pr]) => {
        setPosts(p)
        setProducts(pr)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [siteId])

  const published = posts.filter((p) => p.status === 'yayında')
  const draft = posts.filter((p) => p.status === 'taslak')
  const activeProducts = products.filter((p) => p.status === 'aktif')

  return (
    <div>
      <h2>Genel Bakış</h2>
      <p>Bu sitedeki blog yazıları ve ürünlerin özeti aşağıdadır.</p>
      {error && <div className="auth-error">{error}</div>}
      {loading ? (
        <p>Yükleniyor…</p>
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
            <Link to={`/sites/${siteId}/blog`} className="dashboard-link">Tümünü yönet →</Link>
            {posts.length === 0 ? (
              <p className="muted">Henüz blog yazısı yok. Blog Yazıları sayfasından ekleyebilirsiniz.</p>
            ) : (
              <ul className="blog-preview-list">
                {posts.slice(0, 10).map((post) => (
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
                          : post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('tr-TR')
                            : '—'} · {post.status}
                      </span>
                      {post.content && (
                        <p className="blog-preview-excerpt">{post.content.slice(0, 120)}{post.content.length > 120 ? '…' : ''}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="dashboard-section">
            <h3>Son ürünler</h3>
            <Link to={`/sites/${siteId}/products`} className="dashboard-link">Tümünü yönet →</Link>
            {products.length === 0 ? (
              <p className="muted">Henüz ürün yok. Ürünler sayfasından ekleyebilirsiniz.</p>
            ) : (
              <ul className="blog-preview-list">
                {products.slice(0, 10).map((product) => (
                  <li key={product.id} className="blog-preview-item">
                    {product.image && (
                      <div className="blog-preview-img">
                        <img src={imageSrc(product.image)} alt="" />
                      </div>
                    )}
                    <div className="blog-preview-body">
                      <strong>{product.name}</strong>
                      <span className="blog-preview-meta">
                        {product.price || '—'} · {product.status}
                      </span>
                      {product.description && (
                        <p className="blog-preview-excerpt">{product.description.slice(0, 120)}{product.description.length > 120 ? '…' : ''}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
