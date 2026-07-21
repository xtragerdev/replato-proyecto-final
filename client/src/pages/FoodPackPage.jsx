import { AlertTriangle, ArrowLeft, Check, Clock3, Leaf, MapPin, Minus, PackageOpen, Plus, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../components/common/StatusState.jsx'
import { Price } from '../components/food/Price.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useFoodPack } from '../hooks/useFoodPacks.js'
import { useReservationFlow } from '../hooks/useReservationFlow.js'
import { categoryLabel, formatPickup } from '../utils/format.js'

export default function FoodPackPage() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const packQuery = useFoodPack(id)
  const { state, dispatch, reserve } = useReservationFlow(id)
  const pack = packQuery.data
  useDocumentTitle(pack?.title || 'Detalle de la oferta')

  if (packQuery.isLoading) return <LoadingState label="Preparando la oferta…" />
  if (packQuery.isError) return <div className="container page-section"><ErrorState message={packQuery.error.message} onRetry={packQuery.refetch} /></div>

  return (
    <section className="page-section pack-detail-page">
      <div className="container">
        <Link className="back-link" to="/ofertas"><ArrowLeft size={17} /> Volver a las ofertas</Link>
        <div className="pack-detail-grid">
          <div className="pack-detail-media">
            <img src={pack.image?.url} alt={pack.title} width="900" height="760" />
            <span className="category-badge">{categoryLabel(pack.category)}</span>
          </div>
          <div className="pack-detail-content">
            <div className="business-line"><span>{pack.establishment?.name}</span>{pack.establishment?.isVerified && <ShieldCheck size={17} aria-label="Comercio verificado" />}</div>
            <h1>{pack.title}</h1>
            <p className="pack-description">{pack.description}</p>
            <Price original={pack.originalPriceCents} current={pack.salePriceCents} large />
            <div className="pickup-panel">
              <div><Clock3 size={20} /><span>Recogida</span><strong>{formatPickup(pack.pickupStart)} – {formatPickup(pack.pickupEnd, 'HH:mm')}</strong></div>
              <div><MapPin size={20} /><span>Dirección</span><strong>{pack.establishment?.address?.street}, {pack.establishment?.address?.city}</strong></div>
              <div><PackageOpen size={20} /><span>Disponibilidad</span><strong>Quedan {pack.stockRemaining} packs</strong></div>
            </div>
            <div className="pack-notes">
              <div><Leaf size={18} /><p><strong>Puede contener:</strong> {pack.dietaryTags?.length ? pack.dietaryTags.join(', ') : 'selección variada'}</p></div>
              <div><AlertTriangle size={18} /><p><strong>Alérgenos:</strong> {pack.allergens?.length ? pack.allergens.join(', ') : 'consulta con el comercio'}</p></div>
            </div>

            {state.step === 'success' ? (
              <div className="reservation-success"><span><Check size={24} /></span><div><strong>¡Tu pack está reservado!</strong><p>Encontrarás el código y la información de recogida en tus reservas.</p><Link className="text-link" to="/mis-reservas">Ver mis reservas →</Link></div></div>
            ) : user ? (
              <div className="reservation-bar">
                <div className="quantity-control"><button type="button" aria-label="Reducir cantidad" onClick={() => dispatch({ type: 'quantity', value: Math.max(1, state.quantity - 1) })}><Minus size={17} /></button><strong>{state.quantity}</strong><button type="button" aria-label="Aumentar cantidad" onClick={() => dispatch({ type: 'quantity', value: Math.min(pack.stockRemaining, state.quantity + 1) })}><Plus size={17} /></button></div>
                <button className="button button-accent" type="button" onClick={reserve} disabled={state.step === 'submitting' || user.role !== 'user'}>{state.step === 'submitting' ? 'Reservando…' : 'Reservar ahora'}</button>
                {user.role !== 'user' && <p className="inline-note">Las cuentas de comercio no pueden reservar sus propias ofertas.</p>}
                {state.step === 'error' && <p className="form-error" role="alert">{state.message}</p>}
              </div>
            ) : (
              <div className="reservation-login"><p>Inicia sesión para reservar este pack.</p><Link className="button button-accent" to="/login" state={{ from: location }}>Entrar y reservar</Link></div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

