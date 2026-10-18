import mongoose from 'mongoose'

export const CATEGORIES = ['hall', 'lab', 'sports', 'library', 'equipment', 'mentoring']

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    category: { type: String, enum: CATEGORIES, required: true },
    location: { type: String, required: true, trim: true, maxlength: 100 },

    price: { type: Number, min: 0, default: 0 }, // per slot, in INR
    capacity: { type: Number, min: 1, default: 1 }, // simultaneous bookings per slot
    slotMinutes: { type: Number, min: 15, max: 480, default: 60 },

    openTime: { type: String, match: TIME_RE, default: '09:00' },
    closeTime: { type: String, match: TIME_RE, default: '17:00' },
    openDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] }, // 0 = Sunday
    advanceDays: { type: Number, min: 1, max: 90, default: 14 },

    requiresApproval: { type: Boolean, default: true },
    bookableBy: {
      type: [{ type: String, enum: ['student', 'faculty'] }],
      default: ['student', 'faculty'],
    },

    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },

    // maintained by the reviews feature later
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

serviceSchema.index({ category: 1, isActive: 1 })

serviceSchema.pre('validate', function () {
  if (!this.openTime || !this.closeTime) return
  const span = toMinutes(this.closeTime) - toMinutes(this.openTime)
  if (span <= 0) {
    this.invalidate('closeTime', 'Closing time must be after opening time')
  } else if (span < this.slotMinutes) {
    this.invalidate('slotMinutes', 'Slot length is longer than the opening hours')
  }
})

export default mongoose.model('Service', serviceSchema)