import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    siteId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, default: '' },
    price: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    status: { type: String, enum: ['aktif', 'pasif'], default: 'aktif' },
    /** Filtre anahtarı → seçilen değer (örn. { kategori: "OTC", marka: "X" }) */
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** Ek dosyalar (kullanım kılavuzu vb.): { name: gösterilen ad, url: /uploads/... } */
    attachments: {
      type: [{ name: { type: String, default: '' }, url: { type: String, default: '' } }],
      default: [],
    },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    /** true: ürün detayında sağlık meslek mensubu beyanı (mevzuat kapısı) gösterilir; varsayılan açık */
    hcpProfessionalGate: { type: Boolean, default: true },
  },
  { timestamps: true }
)

productSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = doc._id.toString()
    ret.createdAt = doc.createdAt?.toISOString?.()
    ret.updatedAt = doc.updatedAt?.toISOString?.()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Product', productSchema)
