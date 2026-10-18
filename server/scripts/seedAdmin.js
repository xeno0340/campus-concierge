import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../src/models/User.js'

async function run() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, MONGO_URI } = process.env

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env')
    process.exit(1)
  }

  await mongoose.connect(MONGO_URI)

  const email = ADMIN_EMAIL.toLowerCase()
  const existing = await User.findOne({ email }).select('+password')

  if (existing) {
    existing.password = ADMIN_PASSWORD // re-hashed automatically on save
    existing.role = 'admin'
    existing.isActive = true
    await existing.save()
    console.log(`Admin updated (password reset from .env): ${email}`)
  } else {
    await User.create({
      name: ADMIN_NAME || 'Campus Admin',
      email,
      password: ADMIN_PASSWORD,
      role: 'admin',
    })
    console.log(`Admin created: ${email}`)
  }

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})