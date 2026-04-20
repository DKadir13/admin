import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import ActivityLog from '../models/ActivityLog.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    const items = (list || []).map((x) => ({
      id: x._id.toString(),
      type: x.type,
      action: x.action,
      siteId: x.siteId || '',
      targetId: x.targetId || '',
      label: x.label || '',
      createdAt: x.createdAt?.toISOString?.(),
    }))
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: 'Aktivite listesi alınamadı.' })
  }
})

export default router
