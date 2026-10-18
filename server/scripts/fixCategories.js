import 'dotenv/config'
import mongoose from 'mongoose'
import Service from '../src/models/Service.js'

const allowed = Service.schema.path('category').enumValues || []
console.log('Allowed categories:', allowed.join(', ') || '(no enum, any text)')

// service name -> words to look for in the allowed category list (first hit wins)
const WANT = {
  'Basketball Court': ['sport', 'court', 'fitness', 'recreation'],
  'Meeting Hall': ['hall', 'venue', 'event', 'auditorium', 'meeting', 'room'],
  'Computer Lab': ['lab', 'computer', 'it', 'facility'],
  'Career Mentoring Session': ['mentor', 'counsel', 'guidance', 'career'],
  'Projector Rental': ['equipment', 'gear', 'device'],
  'Library Discussion Room': ['library', 'study', 'room'],
}

await mongoose.connect(process.env.MONGO_URI)

for (const [name, words] of Object.entries(WANT)) {
  const doc = await Service.findOne({ name })
  if (!doc) { console.log(`skip: ${name} not found`); continue }

  let pick = null
  if (allowed.length) {
    for (const w of words) {
      pick = allowed.find((c) => c.toLowerCase().includes(w))
      if (pick) break
    }
  } else {
    pick = words[0]
  }

  if (!pick) {
    console.log(`no match for ${name}, keeping "${doc.category}"`)
    continue
  }
  doc.category = pick
  await doc.save()
  console.log(`ok: ${name} -> ${pick}`)
}

await mongoose.disconnect()