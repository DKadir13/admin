import { Router } from 'express'
import { createToken, removeToken } from '../middleware/auth.js'

const router = Router()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

router.post('/login', async (req, res) => {
  const { password } = req.body || {}
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Şifre hatalı.' })
  }
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
