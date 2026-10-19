import { api } from './api.js'

let scriptPromise

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve()
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = resolve
    s.onerror = () => {
      scriptPromise = null
      reject(new Error('Could not load the payment window. Check your connection.'))
    }
    document.body.appendChild(s)
  })
  return scriptPromise
}

// Resolves with the updated booking. Rejects with Error('dismissed') if the user closes the popup.
export async function payForBooking(booking, user) {
  await loadCheckout()
  const { data: order } = await api.post('/payments/order', { bookingId: booking._id })

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'Campus Concierge',
      description: `Booking ${order.bookingCode}`,
      prefill: { name: user?.name, email: user?.email },
      theme: { color: '#1E2A4A' },
      handler: async (response) => {
        try {
          const { data } = await api.post('/payments/verify', {
            bookingId: booking._id,
            ...response,
          })
          resolve(data.booking)
        } catch (err) {
          reject(err)
        }
      },
      modal: { ondismiss: () => reject(new Error('dismissed')) },
    })
    rzp.open()
  })
}