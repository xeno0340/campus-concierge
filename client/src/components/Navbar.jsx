import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { buttonClasses } from './ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8)

useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 8)
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled ? 'border-line bg-canvas/80 backdrop-blur-xl' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Campus Concierge home">
          <Logo />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/dashboard" className={buttonClasses('ghost', 'sm')}>
                Dashboard
              </Link>
              <button onClick={handleLogout} className={buttonClasses('outline', 'sm')}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`${buttonClasses('ghost', 'sm')} hidden sm:inline-flex`}>
                Sign in
              </Link>
              <Link to="/register" className={buttonClasses('primary', 'sm')}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}