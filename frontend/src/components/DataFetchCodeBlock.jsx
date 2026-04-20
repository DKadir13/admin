import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

const REACT_CODE = (apiBase, siteId) => `// Bu sitedeki blog ve ürün verilerini React ile çekmek için

const API_BASE = '${apiBase}'
const SITE_ID = '${siteId}'

async function getBlogPosts() {
  const res = await fetch(\`\${API_BASE}/api/public/sites/\${SITE_ID}/blog\`)
  if (!res.ok) throw new Error('Blog yüklenemedi')
  return res.json()
}

async function getProducts() {
  const res = await fetch(\`\${API_BASE}/api/public/sites/\${SITE_ID}/products\`)
  if (!res.ok) throw new Error('Ürünler yüklenemedi')
  return res.json()
}

async function getEvents() {
  const res = await fetch(\`\${API_BASE}/api/public/sites/\${SITE_ID}/events\`)
  if (!res.ok) throw new Error('Etkinlikler yüklenemedi')
  return res.json()
}

// React bileşeni örneği
function BlogList() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getBlogPosts()
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Yükleniyor…</p>
  if (error) return <p>Hata: {error}</p>
  return (
    <ul>
      {posts.map((p) => (
        <li key={p.id}>
          <a href={\`/blog/\${p.slug}\`}>{p.title}</a>
        </li>
      ))}
    </ul>
  )
}

// Ürün listesi örneği
function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Yükleniyor…</p>
  return (
    <div className="product-grid">
      {products.map((prod) => (
        <div key={prod.id}>
          {prod.image && <img src={prod.image} alt={prod.name} />}
          <h3>{prod.name}</h3>
          {prod.price && <span>{prod.price}</span>}
        </div>
      ))}
    </div>
  )
}`

export default function DataFetchCodeBlock({ siteId }) {
  const [copied, setCopied] = useState(false)
  const code = REACT_CODE(API_BASE, siteId || 'SITE_ID')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="data-fetch-code-block">
      <div className="data-fetch-code-header">
        <h3>Sitenizde bu verileri React ile nasıl çekersiniz?</h3>
        <p className="data-fetch-code-desc">
          Bu panelde eklediğiniz ürün ve blog verileri diğer sitenizden token olmadan çekilebilir. Aşağıdaki kodu kendi React projenize kopyalayıp <strong>API_BASE</strong> ve <strong>SITE_ID</strong> değerlerini kullanın.
        </p>
        <button type="button" className="btn-copy-code" onClick={handleCopy}>
          {copied ? 'Kopyalandı!' : 'Kodu kopyala'}
        </button>
      </div>
      <pre className="data-fetch-code-pre">
        <code>{code}</code>
      </pre>
      <div className="data-fetch-code-endpoints">
        <strong>Endpoint'ler:</strong>
        <ul>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/blog</code> — Yayındaki blog yazıları</li>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/products</code> — Bu sitede eklediğiniz aktif ürünler (resimler tam URL ile döner)</li>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/events</code> — Aktif etkinlikler (tarih, yer, görsel tam URL)</li>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/blog/:slug</code> — Belirli bir blog yazısı</li>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/blog?search=keyword</code> — Blog yazılarında arama</li>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/products?search=keyword</code> — Ürünlerde arama</li>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/products?category=catId</code> — Kategoriye göre ürünler</li>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/products?tag=tagId</code> — Etikete göre ürünler</li>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/blog?category=catId</code> — Kategoriye göre blog yazıları</li>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/blog?tag=tagId</code> — Etikete göre blog yazıları</li>
          <li><code>GET {API_BASE}/api/public/sites/{siteId}/blog?author=authorId</code> — Yazara göre blog yazıları</li>
          
        </ul>
      </div>
    </section>
  )
}
