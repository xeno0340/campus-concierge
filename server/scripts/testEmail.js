// Usage (from the server folder):  node scripts/testEmail.js you@example.com
import 'dotenv/config'
import { emailMode, sendMail } from '../src/lib/mailer.js'
import { buildEmail } from '../src/lib/notifications.js'

const to = process.argv[2]
if (!to) {
  console.error('Usage: node scripts/testEmail.js you@example.com')
  process.exit(1)
}
if (!emailMode()) {
  console.error('No email settings found in server/.env (see the setup steps).')
  process.exit(1)
}

const mail = buildEmail('confirmed', {
  user: { name: 'Test User' },
  service: { name: 'Seminar Hall A', location: 'Main Block, 2nd floor' },
  booking: {
    bookingCode: 'CC-TEST1234',
    start: new Date(Date.now() + 86400000),
    end: new Date(Date.now() + 86400000 + 3600000),
    amount: 500,
  },
})

try {
  await sendMail({ to, ...mail })
  console.log(`Sent via ${emailMode()}. Check the inbox (and spam) of ${to}.`)
} catch (err) {
  console.error('Sending failed:', err.message)
  process.exit(1)
}