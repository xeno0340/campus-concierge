import { useEffect, useState } from 'react'
import StarRating from './StarRating.jsx'
import { api } from '../lib/api.js'

const fmt = (d) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }).format(new Date(d))

// For managers and admins: latest feedback on the services they run
export default function FeedbackPanel() {
  const [reviews, setReviews] = useState(null)
  const [total, setTotal] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let off = false
    api
      .get('/reviews/manage', { params: { limit: 6 } })
      .then((res) => {
        if (off) return
        setReviews(res.data.reviews)
        setTotal(res.data.pagination.total)
      })
      .catch(() => {
        if (!off) setFailed(true)
      })
    return () => {
      off = true
    }
  }, [])

  if (failed) return null

  const average = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <section className="mt-12" aria-labelledby="feedback-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="feedback-heading" className="font-serif text-2xl text-ink">
          Student feedback
        </h2>
        {reviews?.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <StarRating value={average} size="size-4" />
            latest {reviews.length} of {total}
          </p>
        )}
      </div>

      {reviews === null ? (
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-surface-2" />
      ) : reviews.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line p-8 text-center text-muted">
          No feedback yet. It appears here once students rate a finished booking.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li key={r._id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink">{r.service?.name || 'Service'}</p>
                <StarRating value={r.rating} size="size-4" />
              </div>
              {r.comment && <p className="mt-2 text-sm break-words text-ink/85">{r.comment}</p>}
              <p className="mt-2 text-xs text-muted">
                {r.author} · {fmt(r.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}