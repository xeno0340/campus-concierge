const tone = {
  pending_approval: 'bg-warning/15 text-warning',
  awaiting_payment: 'bg-warning/15 text-warning',
  confirmed: 'bg-success/15 text-success',
  checked_in: 'bg-info/15 text-info',
  completed: 'bg-info/15 text-info',
  rejected: 'bg-danger/15 text-danger',
  no_show: 'bg-danger/15 text-danger',
  cancelled: 'bg-muted/15 text-muted',
  expired: 'bg-muted/15 text-muted',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        tone[status] || 'bg-muted/15 text-muted'
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}