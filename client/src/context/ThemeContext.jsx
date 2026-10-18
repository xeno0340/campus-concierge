import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'

const ThemeContext = createContext(null)
const KEY = 'cc-theme'

const readSaved = () => {
  try {
    return localStorage.getItem(KEY) || 'system'
  } catch {
    return 'system'
  }
}
const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readSaved) // 'light' | 'dark' | 'system'
  const [systemDark, setSystemDark] = useState(prefersDark)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  const setTheme = useCallback((next) => {
    setThemeState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* storage unavailable, the theme still works for this visit */
    }
  }, [])

  // Toggle with a circular reveal that grows from the click point
  const toggle = useCallback(
    (event) => {
      const next = resolved === 'dark' ? 'light' : 'dark'
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!document.startViewTransition || reduce) {
        setTheme(next)
        return
      }

      const x = event?.clientX ?? window.innerWidth / 2
      const y = event?.clientY ?? 0
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      const transition = document.startViewTransition(() => {
        document.documentElement.classList.toggle('dark', next === 'dark')
        flushSync(() => setTheme(next))
      })

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration: 650,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        )
      })
    },
    [resolved, setTheme]
  )

  const value = useMemo(() => ({ theme, resolved, setTheme, toggle }), [theme, resolved, setTheme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext)