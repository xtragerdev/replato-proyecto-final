import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, CircleCheckBig, Clock3, Euro, KeyRound, Leaf, MapPin, PackageOpen, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/apiClient.js'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StatusState.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { formatPickup, formatPrice, reservationStatusLabel } from '../utils/format.js'

const filters = [
  { value: 'upcoming', label: 'Próximas' },
  { value: 'history', label: 'Historial' },
  { value: 'all', label: 'Todas' },
]

function ReservationCard({ reservation, onCancel, isCancelling }) {
  const pack = reservation.pack
  const establishment = pack?.establishment
  const canCancel = ['pending', 'confirmed'].includes(reservation.status)

  return (
    <article className="reservation-card">
      <div className="reservation-card-image">
        {pack?.image?.url ? (
          <img src={pack.image.url} alt="" width="240" height="180" loading="lazy" />
        ) : (
          <PackageOpen aria-hidden="true" size={30} />
        )}
      </div>
      <div className="reservation-card-content">
        <div className="reservation-card-heading">
          <div>
            <p className="reservation-business">{establishment?.name || 'Comercio no disponible'}</p>
            <h2>{pack?.title || 'Pack retirado'}</h2>
          </div>
          <span className={`status-badge status-${reservation.status}`}>{reservationStatusLabel(reservation.status)}</span>
        </div>

        <div className="reservation-details">
          <span><Clock3 aria-hidden="true" size={17} /> {pack?.pickupStart ? formatPickup(pack.pickupStart) : 'Horario no disponible'}</span>
          <span><MapPin aria-hidden="true" size={17} /> {establishment?.address ? `${establishment.address.street}, ${establishment.address.city}` : 'Dirección no disponible'}</span>
          <span><PackageOpen aria-hidden="true" size={17} /> {reservation.quantity} {reservation.quantity === 1 ? 'pack' : 'packs'}</span>
        </div>

        {reservation.status !== 'cancelled' && (
          <div className="pickup-code">
            <KeyRound aria-hidden="true" size={18} />
            <span>Tu código de recogida</span>
            <strong>{reservation.pickupCode || 'Pendiente'}</strong>
          </div>
        )}

        <div className="reservation-actions">
          {pack?._id && <Link className="text-link" to={`/ofertas/${pack._id}`}>Ver oferta</Link>}
          {canCancel && (
            <button className="text-button danger-button" type="button" onClick={() => onCancel(reservation)} disabled={isCancelling}>
              <X aria-hidden="true" size={16} /> {isCancelling ? 'Cancelando…' : 'Cancelar reserva'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default function ReservationsPage() {
  useDocumentTitle('Mis reservas')
  const queryClient = useQueryClient()
  const [activeFilter, setActiveFilter] = useState('upcoming')
  const [reservationToCancel, setReservationToCancel] = useState(null)
  const reservationsQuery = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: async () => {
      const response = await apiRequest('/reservations/mine')
      return response.data
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (reservationId) => {
      const response = await apiRequest(`/reservations/${reservationId}`, {
        method: 'DELETE',
        body: JSON.stringify({ cancelReason: 'Cancelada por el usuario' }),
      })
      return response.data
    },
    onMutate: async (reservationId) => {
      await queryClient.cancelQueries({ queryKey: ['reservations', 'mine'] })
      const previous = queryClient.getQueryData(['reservations', 'mine'])
      queryClient.setQueryData(['reservations', 'mine'], (current = []) => current.map((reservation) => (
        reservation._id === reservationId ? { ...reservation, status: 'cancelled' } : reservation
      )))
      setReservationToCancel(null)
      return { previous }
    },
    onError: (_error, _reservationId, context) => {
      if (context?.previous) queryClient.setQueryData(['reservations', 'mine'], context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] }),
  })

  const reservations = reservationsQuery.data || []
  const filteredReservations = useMemo(() => reservations.filter((reservation) => {
    if (activeFilter === 'upcoming') return ['pending', 'confirmed'].includes(reservation.status)
    if (activeFilter === 'history') return ['collected', 'cancelled'].includes(reservation.status)
    return true
  }), [activeFilter, reservations])

  const impact = useMemo(() => reservations.reduce((summary, reservation) => {
    if (reservation.status === 'cancelled' || !reservation.pack) return summary
    const quantity = reservation.quantity || 1
    summary.packs += quantity
    summary.savedCents += Math.max(0, reservation.pack.originalPriceCents - reservation.pack.salePriceCents) * quantity
    summary.co2Grams += (reservation.pack.impactCo2Grams || 0) * quantity
    return summary
  }, { packs: 0, savedCents: 0, co2Grams: 0 }), [reservations])

  if (reservationsQuery.isLoading) return <LoadingState label="Buscando tus reservas…" />

  return (
    <section className="page-section reservations-page">
      <div className="container">
        <header className="page-heading reservations-heading">
          <div><p className="eyebrow">Tu espacio</p><h1>Mis reservas</h1></div>
          <p>Todo lo que necesitas para recoger tus packs, en un mismo lugar.</p>
        </header>

        {reservationsQuery.isError ? (
          <ErrorState message={reservationsQuery.error.message} onRetry={reservationsQuery.refetch} />
        ) : (
          <>
            <div className="impact-summary" aria-label="Resumen de tu impacto">
              <div><PackageOpen aria-hidden="true" size={20} /><span>Packs salvados</span><strong>{impact.packs}</strong></div>
              <div><Euro aria-hidden="true" size={20} /><span>Ahorro estimado</span><strong>{formatPrice(impact.savedCents)}</strong></div>
              <div><Leaf aria-hidden="true" size={20} /><span>CO₂ evitado</span><strong>{(impact.co2Grams / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} kg</strong></div>
            </div>

            <div className="segmented-control" role="group" aria-label="Filtrar reservas">
              {filters.map((filter) => (
                <button
                  className={activeFilter === filter.value ? 'is-active' : ''}
                  type="button"
                  aria-pressed={activeFilter === filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  key={filter.value}
                >
                  {filter.value === 'upcoming' && <CalendarClock aria-hidden="true" size={17} />}
                  {filter.value === 'history' && <CircleCheckBig aria-hidden="true" size={17} />}
                  {filter.label}
                </button>
              ))}
            </div>

            {cancelMutation.isError && <p className="form-error form-error-box" role="alert">{cancelMutation.error.message}</p>}

            {filteredReservations.length ? (
              <div className="reservation-list">
                {filteredReservations.map((reservation) => (
                  <ReservationCard
                    reservation={reservation}
                    onCancel={setReservationToCancel}
                    isCancelling={cancelMutation.isPending && cancelMutation.variables === reservation._id}
                    key={reservation._id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={activeFilter === 'upcoming' ? 'No tienes recogidas pendientes' : 'No hay reservas en esta sección'}
                text={activeFilter === 'upcoming' ? 'Explora los packs disponibles y salva tu próxima comida.' : 'Cuando completes o canceles una reserva aparecerá aquí.'}
                action={activeFilter === 'upcoming' ? <Link className="button button-accent" to="/ofertas">Explorar ofertas</Link> : null}
              />
            )}
          </>
        )}
      </div>

      {reservationToCancel && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setReservationToCancel(null)}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="dialog-close icon-button" type="button" onClick={() => setReservationToCancel(null)} aria-label="Cerrar"><X size={19} /></button>
            <span className="dialog-icon"><CalendarClock aria-hidden="true" size={24} /></span>
            <h2 id="cancel-title">¿Cancelar esta reserva?</h2>
            <p>El pack volverá a estar disponible para que otra persona pueda salvarlo. Esta acción no se puede deshacer.</p>
            <div className="dialog-actions">
              <button className="button button-secondary" type="button" autoFocus onClick={() => setReservationToCancel(null)}>Mantener reserva</button>
              <button className="button button-danger" type="button" onClick={() => cancelMutation.mutate(reservationToCancel._id)}>Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
