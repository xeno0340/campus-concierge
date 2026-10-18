import mongoose from 'mongoose'

const slotSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 1 }, // snapshot taken when first booked
  booked: { type: Number, default: 0, min: 0 },
})

// One slot document per service per start time
slotSchema.index({ service: 1, start: 1 }, { unique: true })

export default mongoose.model('Slot', slotSchema)