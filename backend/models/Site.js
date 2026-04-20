import mongoose from 'mongoose'

const siteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    logo: { type: String, default: '' },
    /** Canlı / önizleme web sitesi adresi (admin “Web sitesi” butonu) */
    publicUrl: { type: String, default: '' },
    apiBaseUrl: { type: String, default: '' },
    /**
     * Admin / front-end tarafında farklı yazılmış site id’lerini eşlemek için.
     * Örn: "medicaglobal" (klasör) -> "medicaGlobal" (canonical)
     */
    aliases: { type: [String], default: [] },
    /** Site teması (front sitelerde kullanılır) */
    primaryColor: { type: String, default: '' },
    secondaryColor: { type: String, default: '' },
    /** Front-end menüde blog linki ve /blog sayfası için yetkilendirme */
    blogEnabled: { type: Boolean, default: true },
    /** true ise front site "Bakımdayız" gösterebilir */
    maintenanceMode: { type: Boolean, default: false },
    /** Ürün listesinde kullanılacak filtreler: her biri key, label ve seçenek listesine sahip */
    productFilters: [{
      key: { type: String, required: true },
      label: { type: String, required: true },
      options: [{ type: String }],
    }],
  },
  { timestamps: true }
)

siteSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret.id || ret._id?.toString()
    delete ret._id
    delete ret.__v
    delete ret.createdAt
    delete ret.updatedAt
    return ret
  },
})

export default mongoose.model('Site', siteSchema)
