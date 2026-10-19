import mongoose from 'mongoose'

const { Schema } = mongoose

export const STATUSES = [
  'pending_approval',
  'awaiting_payment',
  'confirmed',
  'checked_in',
  'completed',
  'rejected',
  'cancelled',
  'expired',
  'no_show',
]

// Statuses where the booking is waiting on someone and can time out
export const HOLD_STATES = ['pending_approval', 'awaiting_payment']

// Moving into these statuses gives the seat back
export const RELEASING_STATES = ['rejected', 'cancelled', 'expired']

export const TRANSITIONS = {
  pending_approval: ['awaiting_payment', 'confirmed', 'rejected', 'cancelled', 'expired'],
  awaiting_payment: ['confirmed', 'cancelled', 'expired'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['completed'],
}

const historySchema = new Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, maxlength: 300 },
  },
  { _id: false }
)

const bookingSchema = new Schema(
  {
    bookingCode: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    slot: { type: Schema.Types.ObjectId, ref: 'Slot', required: true },

    start: { type: Date, required: true },
    end: { type: Date, required: true },
    amount: { type: Number, min: 0, default: 0 }, // price snapshot at booking time

    status: { type: String, enum: STATUSES, required: true },
    holdsSeat: { type: Boolean, default: true },
    holdExpiresAt: { type: Date, default: null },
    confirmedAt: { type: Date },

        payment: {
      provider: { type: String, default: 'razorpay' },
      orderId: String,
      paymentId: String,
      amount: Number,
      paidAt: Date,
    },

    notes: { type: String, trim: true, maxlength: 300 },
    statusHistory: [historySchema],
  },
  { timestamps: true }
)

// A user cannot hold two seats in the same slot
bookingSchema.index(
  { user: 1, slot: 1 },
  { unique: true, partialFilterExpression: { holdsSeat: true } }
)
bookingSchema.index({ status: 1, holdExpiresAt: 1 })
bookingSchema.index({ service: 1, start: 1 })
bookingSchema.index({ user: 1, createdAt: -1 })

export default mongoose.model('Booking', bookingSchema)