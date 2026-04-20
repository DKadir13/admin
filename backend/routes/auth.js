import { Router } from 'express'
import { createToken, removeToken } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'

const router = Router()
// Admin şifresi düz metin tutulmaz; bcrypt hash ile doğrulanır.
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH || '$2a$10$lMnaMzb52SCFYbVE3WUxA.Ju24KAL.MO0hGLwCyxRTpTOl33Kc8pK'

router.post('/login', async (req, res) => {
  const { password } = req.body || {}
  const ok = await bcrypt.compare(String(password || ''), ADMIN_PASSWORD_HASH)
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
