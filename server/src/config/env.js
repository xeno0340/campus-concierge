// Checks server/.env at startup so a missing value fails loudly instead of
// causing odd errors later. Called once from server.js.
export function validateEnv() {
  const missing = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'].filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`Missing in server/.env: ${missing.join(', ')}`)
    process.exit(1)
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters. Fix server/.env')
    process.exit(1)
  }

  const isProd = process.env.NODE_ENV === 'production'
  if (isProd && !process.env.CLIENT_URL.startsWith('https://')) {
    console.error('In production CLIENT_URL must be an https:// address.')
    process.exit(1)
  }

  // Not fatal: these features switch off politely when unset
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay keys not set: paid bookings will not work.')
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn('RAZORPAY_WEBHOOK_SECRET not set: the payment webhook is switched off.')
  }
  if (!process.env.BREVO_API_KEY && !(process.env.EMAIL_USER && process.env.EMAIL_PASS)) {
    console.warn('Email settings not set: no emails will be sent.')
  }
}

// CLIENT_URL plus any extra origins (comma separated) in CORS_EXTRA_ORIGINS
export function allowedOrigins() {
  const extra = (process.env.CORS_EXTRA_ORIGINS || '').split(',')
  return [process.env.CLIENT_URL, ...extra]
    .map((o) => (o || '').trim().replace(/\/+$/, ''))
    .filter(Boolean)
}