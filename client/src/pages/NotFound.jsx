import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition.jsx'
import { buttonClasses } from '../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <PageTransition>
      <div className="mx-auto grid min-h-[60svh] max-w-6xl place-items-center px-4 text-center">
        <div>
          <p className="text-sm tracking-[0.2em] text-accent-strong uppercase">Error 404</p>
          <h1 className="mt-3 font-display text-5xl text-ink">This page wandered off.</h1>
          <Link to="/" className={`${buttonClasses('primary', 'md')} mt-8`}>
            Back home
          </Link>
        </div>
      </div>
    </PageTransition>
  )
}