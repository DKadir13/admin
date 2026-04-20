import ActivityLog from '../models/ActivityLog.js'

/** Panelde "Son işlemler" için kayıt ekler */
export async function logActivity({ type, action, siteId = '', targetId = '', label = '' }) {
  try {
    await ActivityLog.create({ type, action, siteId, targetId, label })
  } catch (_) {}
}
