import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { buttonClasses } from './ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8)
  const [pastHero, setPastHero] = useState(() => window.scrollY > window.innerHeight - 90)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8)
      setPastHero(window.scrollY > window.innerHeight - 90)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close the menu with Escape, or if the window grows to desktop size
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onResize = () => window.innerWidth >= 768 && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const overHero = pathname === '/' && !pastHero && !open
  const canBook = user && ['student', 'faculty'].includes(user.role)

  const links = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Services' },
    ...(canBook ? [{ to: '/bookings', label: 'My bookings' }] : []),
    ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
  ]

  const close = () => setOpen(false)

  const handleLogout = async () => {
    close()
    await logout()
    navigate('/')
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          overHero
            ? 'dark border-transparent bg-transparent'
            : scrolled || open
              ? 'border-line bg-canvas/90 backdrop-blur-xl'
              : 'border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Campus Concierge home" onClick={close}>
            <Logo />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* desktop links */}
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/services" className={`${buttonClasses('ghost', 'sm')} whitespace-nowrap`}>
                Services
              </Link>
              {user ? (
                <>
                  {canBook && (
                    <Link to="/bookings" className={`${buttonClasses('ghost', 'sm')} whitespace-nowrap`}>
                      My bookings
                    </Link>
                  )}
                  {['manager', 'admin'].includes(user.role) && (
  <Link to="/dashboard" className={`${buttonClasses('ghost', 'sm')} whitespace-nowrap`}>
  Dashboard
</Link>
)}
                  <button onClick={handleLogout} className={`${buttonClasses('outline', 'sm')} whitespace-nowrap`}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className={`${buttonClasses('ghost', 'sm')} whitespace-nowrap`}>
                    Sign in
                  </Link>
                  <Link to="/register" className={`${buttonClasses('primary', 'sm')} whitespace-nowrap`}>
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* hamburger */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="relative grid size-10 place-items-center rounded-full border border-line md:hidden"
            >
              <span
                className={`absolute h-0.5 w-5 rounded bg-ink transition-transform duration-300 ${
                  open ? 'rotate-45' : '-translate-y-1.5'
                }`}
              />
              <span
                className={`absolute h-0.5 w-5 rounded bg-ink transition-transform duration-300 ${
                  open ? '-rotate-45' : 'translate-y-1.5'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* mobile menu (kept outside the header so the blur does not trap it) */}
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            data-lenis-prevent
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-canvas px-6 pt-6 pb-8 md:hidden"
          >
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-6 rounded-2xl border border-line bg-surface p-4"
              >
                <p className="text-xs tracking-[0.18em] text-muted uppercase">Signed in</p>
                <p className="mt-1 font-display text-2xl text-ink">{user.name}</p>
                <p className="text-sm text-muted">{user.email}</p>
              </motion.div>
            )}

            <ul className="flex-1">
              {links.map((l, i) => {
                const active = pathname === l.to
                return (
                  <motion.li
                    key={l.to}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-line"
                  >
                    <Link
                      to={l.to}
                      onClick={close}
                      className={`flex items-center justify-between py-5 font-display text-4xl tracking-tight ${
                        active ? 'text-accent-strong' : 'text-ink'
                      }`}
                    >
                      {l.label}
                      <span className="text-xl text-muted" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </motion.li>
                )
              })}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 grid gap-3"
            >
              {user ? (
                <button onClick={handleLogout} className={`${buttonClasses('outline', 'sm')} w-full justify-center py-3`}>
                  Sign out
                </button>
              ) : (
                <>
                  <Link to="/register" onClick={close} className={`${buttonClasses('primary', 'sm')} w-full justify-center py-3`}>
                    Get started
                  </Link>
                  <Link to="/login" onClick={close} className={`${buttonClasses('outline', 'sm')} w-full justify-center py-3`}>
                    Sign in
                  </Link>
                </>
              )}
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}