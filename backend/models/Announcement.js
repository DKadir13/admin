import mongoose from 'mongoose'

/** Şirket içi duyurular (panelde dashboard'da görünür) */
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, default: '' },
    /** Boşsa tüm panel için; doluysa sadece o site seçiliyken gösterilir */
    siteId: { type: String, default: '', index: true },
  },
  { timestamps: true }
)

announcementSchema.index({ createdAt: -1 })

export default mongoose.model('Announcement', announcementSchema)
