import mongoose, { type Document, type Model } from 'mongoose'

// Strongly-typed interfaces for Event
export interface IEvent {
  title: string
  slug: string
  description: string
  overview: string
  image: string
  venue: string
  location: string
  date: string // stored as ISO date string (YYYY-MM-DD)
  time: string // stored as normalized 24h HH:MM
  mode: string
  audience: string
  agenda: string[]
  organizer: string
  tags: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface IEventDocument extends IEvent, Document {}

export interface IEventModel extends Model<IEventDocument> {}

const { Schema, model } = mongoose

// Helper: generate URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Helper: normalize date to YYYY-MM-DD (ISO date without time)
function normalizeDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date format')
  // Extract YYYY-MM-DD
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Helper: normalize time to 24-hour HH:MM
function normalizeTime(value: string): string {
  const raw = value.trim()
  // Match HH:MM with optional am/pm
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (!m) throw new Error('Invalid time format')

  let hour = Number(m[1])
  const minute = m[2] ? Number(m[2]) : 0
  const meridiem = m[3] ? m[3].toLowerCase() : null

  if (meridiem) {
    if (meridiem === 'pm' && hour < 12) hour += 12
    if (meridiem === 'am' && hour === 12) hour = 0
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) throw new Error('Invalid time value')
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const EventSchema = new Schema<IEventDocument, IEventModel>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    mode: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true },
    agenda: { type: [String], required: true, default: [] },
    organizer: { type: String, required: true, trim: true },
    tags: { type: [String], required: true, default: [] },
  },
  {
    timestamps: true,
    strict: true,
  }
)

// Ensure unique index on slug
EventSchema.index({ slug: 1 }, { unique: true })

// Pre-save hook: generate slug (only if title changed) and normalize date & time
EventSchema.pre<IEventDocument>('save', function (next) {
  try {
    // Validate required string fields are non-empty when trimmed
    const requiredStringFields: Array<keyof IEventDocument> = [
      'title',
      'description',
      'overview',
      'image',
      'venue',
      'location',
      'date',
      'time',
      'mode',
      'audience',
      'organizer',
    ]
    for (const field of requiredStringFields) {
      const val = this[field]

      // Ensure type is string at runtime and that trimmed length > 0.
      if (typeof val !== 'string') {
        throw new Error(`${String(field)} is required and must be a non-empty string`)
      }

      if (val.trim().length === 0) {
        throw new Error(`${String(field)} is required and must be non-empty`)
      }
    }

    // Validate and normalize array fields (`agenda`, `tags`): ensure each element
    // is a non-empty string after trimming. If any element is invalid, throw a
    // Mongoose ValidationError with a clear message referencing the field.
    const arrayFields: Array<'agenda' | 'tags'> = ['agenda', 'tags']
    for (const field of arrayFields) {
      const raw = this[field]
      if (!Array.isArray(raw)) {
        const ve = new mongoose.Error.ValidationError(this)
        ve.addError(field, new mongoose.Error.ValidatorError({ message: `${field} must be an array of non-empty strings`, path: field }))
        throw ve
      }

      // Trim elements and validate type + non-empty
      const trimmed: string[] = raw.map((item: unknown, idx: number) => {
        if (typeof item !== 'string') {
          const ve = new mongoose.Error.ValidationError(this)
          ve.addError(field, new mongoose.Error.ValidatorError({ message: `${field}[${idx}] must be a non-empty string`, path: field }))
          throw ve
        }
        return item.trim()
      })

      // If any trimmed item is empty, throw a ValidationError referencing the index
      const emptyIndex = trimmed.findIndex(s => s.length === 0)
      if (emptyIndex !== -1) {
        const ve = new mongoose.Error.ValidationError(this)
        ve.addError(field, new mongoose.Error.ValidatorError({ message: `${field}[${emptyIndex}] must be a non-empty string`, path: field }))
        throw ve
      }

      // Assign normalized (trimmed) array back to document
      this[field] = trimmed as any
    }

    // Slug generation: only when title is new or modified
    if (this.isModified('title')) {
      this.slug = generateSlug(this.title)
    }

    // Normalize date and time to consistent formats used across the app
    if (this.isModified('date')) {
      this.date = normalizeDate(this.date)
    }
    if (this.isModified('time')) {
      this.time = normalizeTime(this.time)
    }

    next()
  } catch (err) {
    next(err as Error)
  }
})

const Event = model<IEventDocument, IEventModel>('Event', EventSchema)

export default Event
