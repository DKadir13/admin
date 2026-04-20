import mongoose from 'mongoose'

/** Şirket içi hızlı linkler (dashboard'da tek tıkla erişim) */
const quickLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('QuickLink', quickLinkSchema)
