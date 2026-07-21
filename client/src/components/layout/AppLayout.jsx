import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Footer } from './Footer.jsx'
import { Header } from './Header.jsx'
import { MobileNav } from './MobileNav.jsx'

export function AppLayout() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo({ top: 0, behavior: 'instant' }), [pathname])
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <Header />
      <main id="main-content"><Outlet /></main>
      <Footer />
      <MobileNav />
    </div>
  )
}

