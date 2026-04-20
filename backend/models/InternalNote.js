import mongoose from 'mongoose'

/** Şirket içi notlar (site bazlı veya genel) */
const internalNoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, default: '' },
    /** Boşsa "Genel notlar"; doluysa o siteye ait not */
    siteId: { type: String, default: '', index: true },
  },
  { timestamps: true }
)

internalNoteSchema.index({ siteId: 1, createdAt: -1 })

export default mongoose.model('InternalNote', internalNoteSchema)
