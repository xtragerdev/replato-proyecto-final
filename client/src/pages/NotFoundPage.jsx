import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFoundPage() {
  useDocumentTitle('Página no encontrada')

  return (
    <section className="page-section message-page">
      <div className="container message-card">
        <span className="error-code">404</span>
        <span className="message-icon"><SearchX size={30} /></span>
        <h1>Aquí no queda ni una miga.</h1>
        <p>La página que buscas no existe o ha cambiado de dirección.</p>
        <Link className="button button-primary" to="/"><ArrowLeft size={17} /> Volver al inicio</Link>
      </div>
    </section>
  )
}
