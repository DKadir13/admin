import Session from '../models/Session.js'

export async function createToken() {
  const token = `tk_${Date.now()}_${Math.random().toString(36).slice(2)}`
  await Session.create({ token })
  return token
}

export async function isValidToken(token) {
  if (!token || typeof token !== 'string') return false
  const doc = await Session.findOne({ token }).lean()
  return !!doc
}

export async function removeToken(token) {
  await Session.deleteOne({ token })
}

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  isValidToken(token)
    .then((valid) => {
      if (!valid) {
        return res.status(401).json({ error: 'Yetkisiz erişim.' })
      }
      req.token = token
      next()
    })
    .catch(() => res.status(401).json({ error: 'Yetkisiz erişim.' }))
}
