import { Router } from 'express'
import { createToken, removeToken } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'

const router = Router()
// Admin şifresi düz metin tutulmaz; bcrypt hash ile doğrulanır.
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH || '$2a$10$lMnaMzb52SCFYbVE3WUxA.Ju24KAL.MO0hGLwCyxRTpTOl33Kc8pK'

function getClientIp(req) {
  // `trust proxy` açıkken Express, req.ip'yi doğru şekilde doldurur.
  // IPv6-mapped IPv4 formatını normalize edelim: ::ffff:1.2.3.4 -> 1.2.3.4
  const raw = (req.ip || '').trim()
  return raw.startsWith('::ffff:') ? raw.slice('::ffff:'.length) : raw
}

function parseIpPasswordHashes() {
  // JSON formatı beklenir:
  // ADMIN_IP_PASSWORDS='{"85.235.74.60":"$2a$10$...","1.2.3.4":"$2a$10$..."}'
  const raw = process.env.ADMIN_IP_PASSWORDS
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null
  try {
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null
    return obj
  } catch {
    return null
  }
}

router.post('/login', async (req, res) => {
  const { password } = req.body || {}
  const ip = getClientIp(req)

  // IP -> hash eşleşmesi tanımlıysa, sadece o IP'nin hash'i kabul edilir.
  // Tanımlı değilse eski davranış: tek global hash.
  const ipMap = parseIpPasswordHashes()
  const expectedHash = ipMap?.[ip] || ADMIN_PASSWORD_HASH

  // IP map varsa ve bu IP için kayıt yoksa girişe izin verme.
  if (ipMap && !ipMap?.[ip]) {
    return res.status(403).json({ success: false, error: 'Bu IP için giriş izni yok.' })
  }

  const ok = await bcrypt.compare(String(password || ''), String(expectedHash || ''))
  if (!ok) return res.status(401).json({ success: false, error: 'Şifre hatalı.' })
  try {
    const token = await createToken()
    res.json({ success: true, token })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Token oluşturulamadı.' })
  }
})

router.post('/logout', async (req, res) => {
  const auth = req.headers.authorization
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (token) await removeToken(token)
  res.json({ success: true })
})

export default router
