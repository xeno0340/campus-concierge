import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { buttonClasses } from './ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
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

  const overHero = pathname === '/' && !pastHero

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        overHero
          ? 'dark border-transparent bg-transparent'
          : scrolled
            ? 'border-line bg-canvas/80 backdrop-blur-xl'
            : 'border-transparent'
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
    <Link to="/dashboard" className={`${buttonClasses('ghost', 'sm')} whitespace-nowrap`}>
      Dashboard
    </Link>
    <button
      onClick={handleLogout}
      className={`${buttonClasses('outline', 'sm')} whitespace-nowrap max-sm:hidden`}
    >
      Sign out
    </button>
  </>
) : (
  <>
    <Link
      to="/login"
      className={`${buttonClasses('ghost', 'sm')} whitespace-nowrap max-sm:hidden`}
    >
      Sign in
    </Link>
    <Link
      to="/register"
      className={`${buttonClasses('primary', 'sm')} shrink-0 whitespace-nowrap`}
    >
      Get started
    </Link>
  </>
)}
        </div>
      </div>
    </header>
  )
}