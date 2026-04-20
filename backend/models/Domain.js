import mongoose from 'mongoose'

const dnsRecordSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // A, AAAA, CNAME, MX, TXT, NS, SRV vb.
    name: { type: String, default: '' },     // host / alt alan (örn. www, @, mail)
    value: { type: String, required: true },
    ttl: { type: Number, default: 3600 },
    priority: { type: Number, default: null }, // MX için
  },
  { _id: false }
)

const domainSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // örn. example.com
    siteId: { type: String, default: '', index: true }, // hangi siteye ait (opsiyonel)
    expiryDate: { type: Date, default: null },
    registrar: { type: String, default: '' }, // kayıt sağlayıcı
    notes: { type: String, default: '' },
    dnsRecords: [dnsRecordSchema],
  },
  { timestamps: true }
)

domainSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = doc._id.toString()
    ret.createdAt = doc.createdAt?.toISOString?.()
    ret.updatedAt = doc.updatedAt?.toISOString?.()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Domain', domainSchema)
