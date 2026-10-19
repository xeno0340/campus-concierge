import { useCallback, useEffect, useState } from 'react'
import StarRating from './StarRating.jsx'
import { api } from '../lib/api.js'

const fmt = (d) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(d)
  )

export default function ServiceReviews({ serviceId }) {
  const [data, setData] = useState(null)
  const [reviews, setReviews] = useState([])
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let off = false
    api
      .get(`/reviews/service/${serviceId}`, { params: { page: 1, limit: 5 } })
      .then((res) => {
        if (off) return
        setData(res.data)
        setReviews(res.data.reviews)
        setPage(1)
      })
      .catch(() => {
        if (!off) setFailed(true)
      })
    return () => {
      off = true
    }
  }, [serviceId])

  const more = useCallback(async () => {
    setLoadingMore(true)
    try {
      const res = await api.get(`/reviews/service/${serviceId}`, { params: { page: page + 1, limit: 5 } })
      setReviews((r) => [...r, ...res.data.reviews])
      setPage((p) => p + 1)
    } finally {
      setLoadingMore(false)
    }
  }, [serviceId, page])

  if (failed) return null

  const summary = data?.summary
  const total = data?.pagination.total ?? 0

  return (
    <section className="mt-14 border-t border-line pt-10" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="reviews-heading" className="font-display text-3xl text-ink">
          Student feedback
        </h2>
        {summary && summary.count > 0 && (
          <div className="flex items-center gap-3">
            <span className="font-display text-4xl leading-none text-ink">{summary.average.toFixed(1)}</span>
            <div>
              <StarRating value={summary.average} />
              <p className="mt-0.5 text-xs text-muted">
                {summary.count} review{summary.count === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        )}
      </div>

      {data === null ? (
        <div className="mt-6 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-muted">
          No feedback yet. Book a slot and be the first to rate it.
        </p>
      ) : (
        <>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r._id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <StarRating value={r.rating} size="size-4" />
                  <span className="text-xs text-muted">{fmt(r.createdAt)}</span>
                </div>
                {r.comment ? (
                  <p className="mt-3 text-sm break-words text-ink/85">{r.comment}</p>
                ) : (
                  <p className="mt-3 text-sm text-muted italic">Rated without a comment</p>
                )}
                <p className="mt-3 text-xs text-muted">{r.author}</p>
              </li>
            ))}
          </ul>
          {reviews.length < total && (
            <button
              onClick={more}
              disabled={loadingMore}
              className="mt-5 rounded-full border border-line px-5 py-2 text-sm text-ink transition-colors hover:border-accent/60 disabled:opacity-50"
            >
              {loadingMore ? 'Loading' : 'Show more'}
            </button>
          )}
        </>
      )}
    </section>
  )
}