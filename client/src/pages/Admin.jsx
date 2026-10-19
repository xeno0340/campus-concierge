import { useSearchParams } from 'react-router-dom'
import PageTransition from '../components/PageTransition.jsx'
import AdminServices from '../components/admin/AdminServices.jsx'
import AdminUsers from '../components/admin/AdminUsers.jsx'

const TABS = [
  ['services', 'Services'],
  ['users', 'Users'],
]

export default function Admin() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'users' ? 'users' : 'services'

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.2em] text-accent-strong uppercase">Administration</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight text-ink sm:text-6xl">Manage campus</h1>
        <p className="mt-3 max-w-xl text-muted">
          Add and edit the services students can book, and look after who can sign in.
        </p>

        <div className="mt-8 flex gap-6 border-b border-line">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setParams(key === 'services' ? {} : { tab: key }, { replace: true })}
              aria-current={tab === key ? 'page' : undefined}
              className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
                tab === key
                  ? 'border-accent-strong text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8">{tab === 'services' ? <AdminServices /> : <AdminUsers />}</div>
      </div>
    </PageTransition>
  )
}