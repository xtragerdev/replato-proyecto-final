import { Building2, CheckCircle2, MapPinned, Search, ShoppingBag, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function HowItWorksPage() {
  useDocumentTitle('Cómo funciona')
  return (
    <section className="page-section how-page">
      <div className="container narrow-container">
        <header className="page-heading centered"><p className="eyebrow">Cómo funciona</p><h1>Comida aprovechada.<br />Sin vueltas.</h1><p>RePlato pone de acuerdo a quien tiene un excedente y a quien puede disfrutarlo.</p></header>
        <div className="process-list">
          {[
            [Search, 'Explora', 'Busca packs disponibles por ciudad y categoría. Cada oferta indica precio, cantidad y hora de recogida.'],
            [UserPlus, 'Crea tu cuenta', 'Solo necesitamos los datos básicos para identificar tu reserva y mantenerte informado.'],
            [ShoppingBag, 'Reserva', 'Elige la cantidad y confirma. El stock se actualiza para evitar reservas duplicadas.'],
            [MapPinned, 'Recoge', 'Acude al comercio dentro de la franja indicada y enseña tu código de recogida.'],
            [CheckCircle2, 'Completa', 'El comercio confirma la entrega y el impacto se suma a las métricas de la comunidad.'],
          ].map(([Icon, title, text], index) => <article key={title}><span>0{index + 1}</span><Icon size={25} /><div><h2>{title}</h2><p>{text}</p></div></article>)}
        </div>
        <div className="business-explainer"><Building2 size={31} /><div><p className="eyebrow">¿Tienes un comercio?</p><h2>Publicar un excedente lleva menos de dos minutos.</h2><p>Las cuentas colaboradoras disponen de un panel para crear ofertas con imagen, gestionar stock y validar las recogidas.</p></div><Link className="button button-primary" to="/login">Acceder al panel</Link></div>
      </div>
    </section>
  )
}
