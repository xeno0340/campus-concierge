import 'dotenv/config'
import mongoose from 'mongoose'
import Service from '../src/models/Service.js'
import User from '../src/models/User.js'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAYS = [1, 2, 3, 4, 5]

const services = [
  { name: 'Main Seminar Hall', category: 'hall', location: 'Admin Block, 2nd Floor', price: 1500, capacity: 1, slotMinutes: 120, openTime: '09:00', closeTime: '17:00', bookableBy: ['faculty'], description: 'Air-conditioned hall with 150 seats, projector and audio system. Ideal for seminars and workshops.' },
  { name: 'Grand Auditorium', category: 'hall', location: 'Main Block, Ground Floor', price: 4000, capacity: 1, slotMinutes: 120, openTime: '09:00', closeTime: '21:00', bookableBy: ['faculty'], description: '600-seat auditorium with stage lighting and live-stream setup for large events.' },
  { name: 'Computer Lab A', category: 'lab', location: 'CSE Block, Room 101', price: 100, capacity: 30, slotMinutes: 60, openTime: '09:00', closeTime: '17:00', description: '30 workstations with development tools installed. Book a seat for practice or project work.' },
  { name: 'AI Research Lab', category: 'lab', location: 'CSE Block, Room 305', price: 250, capacity: 8, slotMinutes: 60, openTime: '10:00', closeTime: '17:00', description: 'GPU workstations for machine learning and research projects.' },
  { name: 'Badminton Court', category: 'sports', location: 'Sports Complex', price: 80, capacity: 1, slotMinutes: 60, openTime: '06:00', closeTime: '21:00', openDays: ALL_DAYS, requiresApproval: false, description: 'Indoor wooden-floor court. Rackets and shuttles available on request.' },
  { name: 'Cricket Nets', category: 'sports', location: 'Main Ground', price: 150, capacity: 2, slotMinutes: 60, openTime: '06:00', closeTime: '18:00', openDays: ALL_DAYS, requiresApproval: false, description: 'Two practice nets with bowling machine access.' },
  { name: 'Library Discussion Room', category: 'library', location: 'Central Library, 1st Floor', price: 0, capacity: 1, slotMinutes: 60, openTime: '08:00', closeTime: '20:00', requiresApproval: false, description: 'Quiet glass-walled room for group study, with whiteboard and charging points.' },
  { name: 'Projector Rental', category: 'equipment', location: 'Equipment Store, Admin Block', price: 200, capacity: 5, slotMinutes: 120, openTime: '09:00', closeTime: '17:00', description: 'HD portable projector with HDMI cable and screen. Five units available.' },
  { name: 'DSLR Camera Kit', category: 'equipment', location: 'Media Lab', price: 400, capacity: 2, slotMinutes: 120, openTime: '10:00', closeTime: '16:00', openDays: WEEKDAYS, description: 'DSLR body, two lenses, tripod and memory card for events and projects.' },
  { name: 'Career Mentoring Session', category: 'mentoring', location: 'Training & Placement Cell', price: 0, capacity: 1, slotMinutes: 30, openTime: '14:00', closeTime: '17:00', openDays: WEEKDAYS, description: 'One-to-one session with a placement mentor: resume review, mock interview, career guidance.' },
]

async function run() {
  await mongoose.connect(process.env.MONGO_URI)

  const manager = await User.findOne({ email: 'manager@campus.test', role: 'manager' })
  if (!manager) console.log('Note: manager@campus.test not found, services will have no manager')

  for (const s of services) {
    const data = { ...s, ...(manager && { manager: manager._id }) }
    const res = await Service.updateOne({ name: s.name }, { $setOnInsert: data }, { upsert: true })
    console.log(res.upsertedCount ? `Created: ${s.name}` : `Exists:  ${s.name}`)
  }

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})