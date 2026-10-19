import mongoose from 'mongoose'

const { Schema } = mongoose

const reviewSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true }, // one review per booking
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
)

reviewSchema.index({ service: 1, createdAt: -1 })
reviewSchema.index({ user: 1 })

export default mongoose.model('Review', reviewSchema)