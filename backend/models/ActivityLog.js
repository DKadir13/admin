import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['product', 'blog', 'site', 'domain'], required: true },
    action: { type: String, enum: ['create', 'update', 'delete'], required: true },
    siteId: { type: String, default: '' },
    targetId: { type: String, default: '' },
    /** Kullanıcıya gösterilen kısa açıklama (örn. "Ürün: X eklendi") */
    label: { type: String, default: '' },
  },
  { timestamps: true }
)

activityLogSchema.index({ createdAt: -1 })

export default mongoose.model('ActivityLog', activityLogSchema)
