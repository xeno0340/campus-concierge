import 'dotenv/config'
import mongoose from 'mongoose'
import Service from '../src/models/Service.js'

// old name -> new details, and which existing service to borrow the category from
const SWAPS = [
  {
    from: 'Yoga Studio',
    categoryFrom: 'Cricket Nets',
    set: { name: 'Basketball Court', location: 'Sports Complex, Court 1', price: 100, slotMinutes: 60 },
  },
  {
    from: 'Cricket Nets',
    categoryFrom: 'Library Discussion Room',
    set: { name: 'Meeting Hall', location: 'Admin Block, 2nd Floor', price: 500, slotMinutes: 120, capacity: 40 },
  },
  {
    from: 'DSLR Camera Kit',
    categoryFrom: 'DSLR Camera Kit',
    set: { name: 'Computer Lab', location: 'CSE Block, Lab 3', price: 0, slotMinutes: 120, capacity: 30 },
  },
]

await mongoose.connect(process.env.MONGO_URI)

// look up all categories first, so swapping one doesn't hide another
const cats = {}
for (const s of SWAPS) {
  const donor = await Service.findOne({ name: s.categoryFrom })
  cats[s.from] = donor?.category
}

for (const s of SWAPS) {
  const doc = await Service.findOne({ name: s.from })
  if (!doc) {
    console.log(`skip: "${s.from}" not found (already swapped?)`)
    continue
  }
  const fields = { ...s.set }
  if (cats[s.from]) fields.category = cats[s.from]
  // only set fields your schema actually has
  for (const [k, v] of Object.entries(fields)) {
    if (Service.schema.path(k)) doc.set(k, v)
  }
  doc.images = []
  await doc.save()
  console.log(`ok: ${s.from} -> ${doc.name} (${doc.category})`)
}

await mongoose.disconnect()