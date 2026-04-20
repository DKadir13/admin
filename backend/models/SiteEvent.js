import mongoose from 'mongoose'

const siteEventSchema = new mongoose.Schema(
  {
    siteId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, default: '' },
    description: { type: String, default: '' },
    /** Etkinlik tarihi (gösterim / sıralama) */
    eventDate: { type: Date, default: null },
    location: { type: String, default: '' },
    image: { type: String, default: '' },
    /** Dış bağlantı (kayıt, detay sayfası vb.) */
    linkUrl: { type: String, default: '' },
    status: { type: String, enum: ['aktif', 'pasif'], default: 'aktif' },
    /** Listede önce göster (küçük sayı önce) */
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

siteEventSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = doc._id.toString()
    ret.createdAt = doc.createdAt?.toISOString?.()
    ret.updatedAt = doc.updatedAt?.toISOString?.()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('SiteEvent', siteEventSchema)
