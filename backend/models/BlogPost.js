import mongoose from 'mongoose'

const blogPostSchema = new mongoose.Schema(
  {
    siteId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, default: '' },
    content: { type: String, default: '' },
    /** Kapak / öne çıkan resim (URL veya /uploads/... yolu) */
    image: { type: String, default: '' },
    status: { type: String, enum: ['taslak', 'yayında'], default: 'taslak' },
    /** Yayın / geçerlilik tarihi; bu tarihten itibaren keepForDays kadar süre gösterilir (keepPermanent değilse) */
    publishedAt: { type: Date, default: null },
    /** Yazı yanında gösterilecek tarihler (örn. 11, 12, 13 Şubat); boşsa publishedAt kullanılır */
    displayDates: { type: [Date], default: [] },
    /** true ise yazı sürekli sabit kalır, süre dolmaz */
    keepPermanent: { type: Boolean, default: true },
    /** publishedAt tarihinden sonra kaç gün daha kalsın (keepPermanent false ise kullanılır) */
    keepForDays: { type: Number, default: 30 },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
  },
  { timestamps: true }
)

blogPostSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = doc._id.toString()
    ret.createdAt = doc.createdAt?.toISOString?.()
    ret.updatedAt = doc.updatedAt?.toISOString?.()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('BlogPost', blogPostSchema)
