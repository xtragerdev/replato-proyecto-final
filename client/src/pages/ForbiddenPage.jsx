import { LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function ForbiddenPage() {
  useDocumentTitle('Acceso restringido')

  return (
    <section className="page-section message-page">
      <div className="container message-card">
        <span className="message-icon"><LockKeyhole size={30} /></span>
        <p className="eyebrow">Acceso restringido</p>
        <h1>Esta zona tiene otro delantal.</h1>
        <p>Tu cuenta no dispone del permiso necesario para abrir este panel.</p>
        <Link className="button button-primary" to="/">Volver al inicio</Link>
      </div>
    </section>
  )
}
