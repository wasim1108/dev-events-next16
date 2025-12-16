import mongoose, { type Document, type Model, Types } from 'mongoose'
import Event from './event.model'

// Booking interfaces
export interface IBooking {
  eventId: Types.ObjectId
  email: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IBookingDocument extends IBooking, Document {}
export interface IBookingModel extends Model<IBookingDocument> {}

const { Schema, model } = mongoose

// Simple email regex for validation (practical, not RFC-perfect)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const BookingSchema = new Schema<IBookingDocument, IBookingModel>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    email: { type: String, required: true, trim: true },
  },
  { timestamps: true, strict: true }
)

// Prevent duplicate bookings for the same event
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true })

// Pre-save hook: ensure referenced Event exists and email is valid
BookingSchema.pre<IBookingDocument>('save', async function (next) {
  try {
    // Validate email format
    if (typeof this.email !== 'string' || !EMAIL_RE.test(this.email)) {
      throw new Error('Invalid email format')
    }

    // Verify that the referenced Event exists
    const exists = await Event.exists({ _id: this.eventId })
    if (!exists) {
      throw new Error('Referenced eventId does not exist')
    }

    next()
  } catch (err) {
    next(err as Error)
  }
})

const Booking = model<IBookingDocument, IBookingModel>('Booking', BookingSchema)

export default Booking
