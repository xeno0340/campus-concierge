import { useState } from 'react'
import Modal from './Modal.jsx'
import StarRating from './StarRating.jsx'
import { api } from '../lib/api.js'

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

// Props: booking (needs _id and service.name), onClose (stable), onDone(review)
export default function ReviewModal({ booking, onClose, onDone }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!rating) {
      setError('Please pick a star rating')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await api.post('/reviews', {
        bookingId: booking._id,
        rating,
        comment: comment.trim() || undefined,
      })
      onDone(res.data.review)
    } catch (err) {
      setError(err.userMessage || 'Could not save your feedback')
      setBusy(false)
    }
  }

  return (
    <Modal title="Rate your visit" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="text-sm text-muted">How was {booking.service?.name || 'this service'}?</p>

        <div className="mt-4 flex items-center gap-3">
          <StarRating value={rating} onChange={setRating} size="size-9" label="Your rating" />
          <span className="text-sm text-muted">{WORDS[rating]}</span>
        </div>

        <label htmlFor="review-comment" className="mt-6 block text-sm text-muted">
          Comments (optional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="What went well? What could be better?"
          className="mt-2 w-full resize-none rounded-xl border border-line bg-surface-2 p-3 text-sm text-ink focus:border-accent focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-muted">{comment.length}/500</p>

        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-ink">
            Not now
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-on-primary disabled:opacity-50"
          >
            {busy ? 'Sending' : 'Submit feedback'}
          </button>
        </div>
      </form>
    </Modal>
  )
}