import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../common/Logo.jsx'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>Buen comer. Cero desperdicio.</p>
        </div>
        <div><strong>Descubre</strong><Link to="/ofertas">Ofertas</Link><Link to="/como-funciona">Cómo funciona</Link></div>
        <div><strong>Participa</strong><Link to="/registro">Crear cuenta</Link><Link to="/login">Acceso comercios</Link></div>
        <a className="footer-project" href="https://github.com/xtragerdev" target="_blank" rel="noreferrer">Proyecto de xtragerdev <ArrowUpRight size={16} /></a>
      </div>
    </footer>
  )
}

