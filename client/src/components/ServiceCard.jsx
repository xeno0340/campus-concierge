import { Link } from 'react-router-dom'
import TiltCard from './TiltCard.jsx'
import ServiceImage from './ServiceImage.jsx'
import { CATEGORY_LABELS, formatPrice } from '../lib/format.js'

export default function ServiceCard({ service }) {
  return (
    <Link to={`/services/${service._id}`} className="block rounded-2xl" aria-label={service.name}>
      <TiltCard className="rounded-2xl">
        <article
          data-cursor="View"
          className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-soft transition-colors duration-500 hover:border-accent/60"
        >
          <div className="relative h-44 overflow-hidden border-b border-line bg-surface-2">
            <ServiceImage
              category={service.category}
              name={service.name}
              image={service.images?.[0]}
              className="h-full w-full"
            />
            <span className="absolute top-3 left-3 rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-white/90 uppercase backdrop-blur-md">
              {CATEGORY_LABELS[service.category]}
            </span>
            {service.requiresApproval && (
              <span className="absolute top-3 right-3 rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
                Approval needed
              </span>
            )}
          </div>
          <div className="p-6">
            <h3 className="font-display text-2xl leading-tight text-ink">{service.name}</h3>
            <p className="mt-2 text-sm text-muted">{service.location}</p>
            <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
              <span className="font-medium text-ink">{formatPrice(service.price)}</span>
              <span className="text-muted">{service.slotMinutes} min slots</span>
            </div>
          </div>
        </article>
      </TiltCard>
    </Link>
  )
}