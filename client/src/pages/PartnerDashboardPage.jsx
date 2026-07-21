import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  CheckCircle2,
  CircleGauge,
  ImageUp,
  PackageCheck,
  PackageOpen,
  Plus,
  Store,
  Trash2,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { z } from 'zod'
import { apiRequest } from '../api/apiClient.js'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StatusState.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { formatPickup, formatPrice, reservationStatusLabel } from '../utils/format.js'

const MAX_IMAGE_SIZE = 4 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const offerSchema = z.object({
  establishmentId: z.string().min(1, 'Selecciona un comercio'),
  title: z.string().trim().min(3, 'Escribe al menos 3 caracteres').max(120),
  description: z.string().trim().min(20, 'Explica el contenido en al menos 20 caracteres').max(600),
  category: z.enum(['bakery', 'prepared_food', 'produce', 'breakfast', 'vegan', 'mixed']),
  originalPrice: z.coerce.number().positive('Indica un precio válido'),
  salePrice: z.coerce.number().positive('Indica un precio válido'),
  stockTotal: z.coerce.number().int().min(1).max(100),
  pickupStart: z.string().min(1, 'Indica cuándo empieza la recogida'),
  pickupEnd: z.string().min(1, 'Indica cuándo termina la recogida'),
  dietaryTags: z.string().max(240).optional().default(''),
  allergens: z.string().max(240).optional().default(''),
  estimatedWeightGrams: z.coerce.number().int().min(0).max(100000),
  impactCo2Grams: z.coerce.number().int().min(0).max(100000),
  image: z.any().optional().refine(
    (files) => !files?.length || files[0].size <= MAX_IMAGE_SIZE,
    'La imagen no puede superar los 4 MB',
  ).refine(
    (files) => !files?.length || IMAGE_TYPES.includes(files[0].type),
    'Utiliza una imagen JPG, PNG o WebP',
  ),
}).superRefine((values, context) => {
  if (values.salePrice >= values.originalPrice) {
    context.addIssue({ code: 'custom', path: ['salePrice'], message: 'Debe ser menor que el precio original' })
  }
  if (new Date(values.pickupEnd) <= new Date(values.pickupStart)) {
    context.addIssue({ code: 'custom', path: ['pickupEnd'], message: 'Debe terminar después del inicio' })
  }
})

const categoryOptions = [
  ['mixed', 'Pack sorpresa'],
  ['bakery', 'Panadería'],
  ['prepared_food', 'Comida preparada'],
  ['produce', 'Fruta y verdura'],
  ['breakfast', 'Desayuno'],
  ['vegan', 'Vegano'],
]

const reservationStatuses = ['pending', 'confirmed', 'collected', 'cancelled']

function localDateTime(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function getOfferDefaults() {
  const now = Date.now()
  return {
    establishmentId: '',
    title: '',
    description: '',
    category: 'mixed',
    originalPrice: 12,
    salePrice: 4,
    stockTotal: 4,
    pickupStart: localDateTime(new Date(now + 2 * 60 * 60 * 1000)),
    pickupEnd: localDateTime(new Date(now + 4 * 60 * 60 * 1000)),
    dietaryTags: '',
    allergens: '',
    estimatedWeightGrams: 800,
    impactCo2Grams: 1500,
    image: undefined,
  }
}

function FieldError({ error }) {
  if (!error) return null
  return <span className="field-error" role="alert">{error.message}</span>
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="dashboard-metric">
      <span className="dashboard-metric-icon"><Icon size={20} aria-hidden="true" /></span>
      <div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
    </article>
  )
}

function offerStatusLabel(status) {
  return {
    available: 'Disponible',
    sold_out: 'Agotada',
    expired: 'Caducada',
    cancelled: 'Cancelada',
  }[status] || status
}

function statusChartTooltip(value) {
  return [value, 'Reservas']
}

export default function PartnerDashboardPage() {
  useDocumentTitle('Panel del comercio')
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const establishmentsQuery = useQuery({
    queryKey: ['partner', 'establishments'],
    queryFn: async () => (await apiRequest('/establishments/mine')).data,
  })
  const offersQuery = useQuery({
    queryKey: ['partner', 'offers'],
    queryFn: async () => (await apiRequest('/food-packs/mine')).data,
  })
  const reservationsQuery = useQuery({
    queryKey: ['partner', 'reservations'],
    queryFn: async () => (await apiRequest('/reservations/received')).data,
  })

  const establishments = establishmentsQuery.data || []
  const offers = offersQuery.data || []
  const reservations = reservationsQuery.data || []
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(offerSchema), defaultValues: getOfferDefaults() })

  useEffect(() => {
    if (establishments.length === 1) setValue('establishmentId', establishments[0]._id)
  }, [establishments, setValue])

  const metrics = useMemo(() => ({
    published: offers.length,
    availableUnits: offers.reduce((total, offer) => total + offer.stockRemaining, 0),
    awaitingPickup: reservations.filter(({ status }) => status === 'pending' || status === 'confirmed').length,
    collected: reservations.filter(({ status }) => status === 'collected').length,
  }), [offers, reservations])

  const chartData = useMemo(() => reservationStatuses.map((status) => ({
    status: reservationStatusLabel(status),
    reservas: reservations.filter((reservation) => reservation.status === status).length,
  })), [reservations])

  const createMutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData()
      const payload = {
        establishmentId: values.establishmentId,
        title: values.title,
        description: values.description,
        category: values.category,
        originalPriceCents: Math.round(values.originalPrice * 100),
        salePriceCents: Math.round(values.salePrice * 100),
        stockTotal: values.stockTotal,
        pickupStart: new Date(values.pickupStart).toISOString(),
        pickupEnd: new Date(values.pickupEnd).toISOString(),
        dietaryTags: values.dietaryTags,
        allergens: values.allergens,
        estimatedWeightGrams: values.estimatedWeightGrams,
        impactCo2Grams: values.impactCo2Grams,
      }
      Object.entries(payload).forEach(([key, value]) => formData.append(key, String(value)))
      if (values.image?.[0]) formData.append('image', values.image[0])
      return apiRequest('/food-packs', { method: 'POST', body: formData })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'offers'] })
      queryClient.invalidateQueries({ queryKey: ['food-packs'] })
      queryClient.invalidateQueries({ queryKey: ['impact'] })
      const defaults = getOfferDefaults()
      defaults.establishmentId = establishments.length === 1 ? establishments[0]._id : ''
      reset(defaults)
      setFormOpen(false)
      setNotice({ type: 'success', text: 'La oferta ya está publicada.' })
    },
    onError: (error) => setNotice({ type: 'error', text: error.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: (offerId) => apiRequest(`/food-packs/${offerId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'offers'] })
      queryClient.invalidateQueries({ queryKey: ['food-packs'] })
      setNotice({ type: 'success', text: 'Oferta eliminada correctamente.' })
    },
    onError: (error) => setNotice({ type: 'error', text: error.message }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ reservationId, status }) => apiRequest(`/reservations/${reservationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'reservations'] })
      queryClient.invalidateQueries({ queryKey: ['partner', 'offers'] })
      setNotice({ type: 'success', text: `Reserva marcada como ${reservationStatusLabel(variables.status).toLowerCase()}.` })
    },
    onError: (error) => setNotice({ type: 'error', text: error.message }),
  })

  function removeOffer(offer) {
    const confirmed = window.confirm(`¿Eliminar “${offer.title}”? Solo es posible si no tiene reservas activas.`)
    if (confirmed) deleteMutation.mutate(offer._id)
  }

  function changeReservationStatus(reservation, status) {
    if (status === 'cancelled' && !window.confirm('¿Cancelar esta reserva? La unidad volverá a estar disponible.')) return
    statusMutation.mutate({ reservationId: reservation._id, status })
  }

  const initialLoading = establishmentsQuery.isLoading || offersQuery.isLoading || reservationsQuery.isLoading
  const initialError = establishmentsQuery.error || offersQuery.error || reservationsQuery.error

  return (
    <section className="page-section dashboard-page">
      <div className="container">
        <header className="page-heading dashboard-heading">
          <div><p className="eyebrow">Área profesional</p><h1>Tu comercio, de un vistazo.</h1></div>
          <button className="button button-accent" type="button" onClick={() => setFormOpen((open) => !open)} disabled={!establishments.length}>
            <Plus size={18} /> {formOpen ? 'Cerrar formulario' : 'Publicar oferta'}
          </button>
        </header>

        {notice && <div className={`inline-notice is-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}<button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">×</button></div>}
        {initialLoading && <LoadingState label="Preparando tu panel…" />}
        {initialError && <ErrorState message={initialError.message} onRetry={() => { establishmentsQuery.refetch(); offersQuery.refetch(); reservationsQuery.refetch() }} />}

        {!initialLoading && !initialError && (
          <>
            <div className="dashboard-metrics">
              <MetricCard icon={PackageOpen} label="Ofertas publicadas" value={metrics.published} detail={`${establishments.length} comercios`} />
              <MetricCard icon={CircleGauge} label="Unidades disponibles" value={metrics.availableUnits} detail="Stock actual" />
              <MetricCard icon={CalendarClock} label="Por preparar" value={metrics.awaitingPickup} detail="Pendientes o confirmadas" />
              <MetricCard icon={PackageCheck} label="Recogidas" value={metrics.collected} detail="Reservas completadas" />
            </div>

            {formOpen && (
              <section className="dashboard-panel offer-form-panel" aria-labelledby="new-offer-title">
                <div className="panel-heading"><div><p className="eyebrow">Nueva publicación</p><h2 id="new-offer-title">Crea un pack atractivo y claro</h2></div><p>La franja, el stock y el contenido deben corresponder con lo que encontrará la persona al recogerlo.</p></div>
                <form className="dashboard-form" onSubmit={handleSubmit((values) => createMutation.mutate(values))} noValidate>
                  <label className="form-field">Comercio
                    <select {...register('establishmentId')} aria-invalid={Boolean(errors.establishmentId)}>
                      <option value="">Selecciona un comercio</option>
                      {establishments.map((establishment) => <option value={establishment._id} key={establishment._id}>{establishment.name}</option>)}
                    </select><FieldError error={errors.establishmentId} />
                  </label>
                  <label className="form-field">Nombre del pack
                    <input {...register('title')} placeholder="Pack de pan y bollería del día" aria-invalid={Boolean(errors.title)} />
                    <FieldError error={errors.title} />
                  </label>
                  <label className="form-field form-field-wide">Qué incluye
                    <textarea {...register('description')} rows="4" placeholder="Describe el contenido aproximado y cualquier información útil." aria-invalid={Boolean(errors.description)} />
                    <FieldError error={errors.description} />
                  </label>
                  <label className="form-field">Categoría
                    <select {...register('category')}>{categoryOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
                  </label>
                  <label className="form-field">Precio habitual (€)
                    <input type="number" min="0.01" step="0.01" {...register('originalPrice')} aria-invalid={Boolean(errors.originalPrice)} />
                    <FieldError error={errors.originalPrice} />
                  </label>
                  <label className="form-field">Precio RePlato (€)
                    <input type="number" min="0.01" step="0.01" {...register('salePrice')} aria-invalid={Boolean(errors.salePrice)} />
                    <FieldError error={errors.salePrice} />
                  </label>
                  <label className="form-field">Unidades
                    <input type="number" min="1" max="100" {...register('stockTotal')} aria-invalid={Boolean(errors.stockTotal)} />
                    <FieldError error={errors.stockTotal} />
                  </label>
                  <label className="form-field">Inicio de recogida
                    <input type="datetime-local" {...register('pickupStart')} aria-invalid={Boolean(errors.pickupStart)} />
                    <FieldError error={errors.pickupStart} />
                  </label>
                  <label className="form-field">Fin de recogida
                    <input type="datetime-local" {...register('pickupEnd')} aria-invalid={Boolean(errors.pickupEnd)} />
                    <FieldError error={errors.pickupEnd} />
                  </label>
                  <label className="form-field">Peso aproximado (g)
                    <input type="number" min="0" {...register('estimatedWeightGrams')} aria-invalid={Boolean(errors.estimatedWeightGrams)} />
                    <FieldError error={errors.estimatedWeightGrams} />
                  </label>
                  <label className="form-field">CO₂ evitado aproximado (g)
                    <input type="number" min="0" {...register('impactCo2Grams')} aria-invalid={Boolean(errors.impactCo2Grams)} />
                    <FieldError error={errors.impactCo2Grams} />
                  </label>
                  <label className="form-field">Etiquetas alimentarias
                    <input {...register('dietaryTags')} placeholder="vegetariano, sin lactosa" />
                    <small>Separadas por comas.</small>
                  </label>
                  <label className="form-field">Alérgenos
                    <input {...register('allergens')} placeholder="gluten, frutos secos" />
                    <small>Separados por comas.</small>
                  </label>
                  <label className="form-field form-field-wide file-field"><span><ImageUp size={20} /> Imagen del pack</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" {...register('image')} />
                    <small>JPG, PNG o WebP. Máximo 4 MB. Se subirá de forma segura a Cloudinary.</small>
                    <FieldError error={errors.image} />
                  </label>
                  <div className="form-actions form-field-wide">
                    <button className="button button-accent" type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Publicando…' : 'Publicar oferta'}</button>
                    <button className="button button-secondary" type="button" onClick={() => setFormOpen(false)}>Cancelar</button>
                  </div>
                </form>
              </section>
            )}

            {!establishments.length && (
              <EmptyState title="Necesitas un comercio vinculado" text="Un administrador debe verificar y asociar al menos un establecimiento antes de que puedas publicar ofertas." />
            )}

            <div className="dashboard-grid">
              <section className="dashboard-panel" aria-labelledby="reservation-chart-title">
                <div className="panel-heading compact"><div><p className="eyebrow">Actividad</p><h2 id="reservation-chart-title">Estado de reservas</h2></div></div>
                <div className="dashboard-chart" role="img" aria-label="Gráfico de reservas por estado">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="status" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <Tooltip formatter={statusChartTooltip} cursor={{ fill: 'rgba(35, 107, 88, .07)' }} />
                      <Bar dataKey="reservas" fill="var(--color-brand-500, #236b58)" radius={[7, 7, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="dashboard-panel" aria-labelledby="stores-title">
                <div className="panel-heading compact"><div><p className="eyebrow">Tus espacios</p><h2 id="stores-title">Comercios</h2></div></div>
                <div className="store-list">
                  {establishments.map((establishment) => (
                    <article className="store-row" key={establishment._id}>
                      <span className="store-row-icon"><Store size={20} /></span>
                      <div><strong>{establishment.name}</strong><span>{establishment.address?.city} · {establishment.category}</span></div>
                      <span className={`status-badge ${establishment.isVerified ? 'is-collected' : 'is-pending'}`}>
                        {establishment.isVerified ? 'Verificado' : 'Pendiente'}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <section className="dashboard-panel" aria-labelledby="offers-title">
              <div className="panel-heading compact"><div><p className="eyebrow">Inventario</p><h2 id="offers-title">Ofertas publicadas</h2></div><span>{offers.length} en total</span></div>
              {!offers.length ? <EmptyState title="Todavía no has publicado ofertas" text="Publica tu primer pack para empezar a recuperar valor de tus excedentes." /> : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead><tr><th>Oferta</th><th>Comercio</th><th>Precio</th><th>Stock</th><th>Recogida</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                    <tbody>{offers.map((offer) => (
                      <tr key={offer._id}>
                        <td><div className="table-primary"><img src={offer.image?.url} alt="" width="48" height="48" /><strong>{offer.title}</strong></div></td>
                        <td>{offer.establishment?.name}</td>
                        <td>{formatPrice(offer.salePriceCents)}</td>
                        <td>{offer.stockRemaining} / {offer.stockTotal}</td>
                        <td>{formatPickup(offer.pickupStart, 'd MMM · HH:mm')}</td>
                        <td><span className={`status-badge is-${offer.status}`}>{offerStatusLabel(offer.status)}</span></td>
                        <td><button className="icon-button danger" type="button" onClick={() => removeOffer(offer)} disabled={deleteMutation.isPending && deleteMutation.variables === offer._id} aria-label={`Eliminar ${offer.title}`}><Trash2 size={17} /></button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="dashboard-panel" aria-labelledby="received-title">
              <div className="panel-heading compact"><div><p className="eyebrow">Recogidas</p><h2 id="received-title">Reservas recibidas</h2></div><span>{reservations.length} en total</span></div>
              {!reservations.length ? <EmptyState title="Aún no has recibido reservas" text="Cuando alguien reserve una oferta, podrás gestionarla desde aquí." /> : (
                <div className="reservation-management-list">
                  {reservations.map((reservation) => {
                    const changingThis = statusMutation.isPending && statusMutation.variables?.reservationId === reservation._id
                    return (
                      <article className="reservation-management-card" key={reservation._id}>
                        <div className="reservation-person"><span><UsersRound size={19} /></span><div><strong>{reservation.user?.name || 'Usuario'}</strong><small>{reservation.user?.email}</small></div></div>
                        <div className="reservation-pack"><strong>{reservation.pack?.title || 'Oferta eliminada'}</strong><span>{reservation.pack?.establishment?.name}</span>{reservation.pack?.pickupStart && <small>{formatPickup(reservation.pack.pickupStart)}</small>}</div>
                        <div className="reservation-code"><span>Código</span><strong>{reservation.pickupCode}</strong><small>{reservation.quantity} {reservation.quantity === 1 ? 'unidad' : 'unidades'}</small></div>
                        <span className={`status-badge is-${reservation.status}`}>{reservationStatusLabel(reservation.status)}</span>
                        <div className="reservation-actions">
                          {reservation.status === 'pending' && <button className="button button-secondary button-small" type="button" disabled={changingThis} onClick={() => changeReservationStatus(reservation, 'confirmed')}><CheckCircle2 size={15} /> Confirmar</button>}
                          {reservation.status === 'confirmed' && <button className="button button-accent button-small" type="button" disabled={changingThis} onClick={() => changeReservationStatus(reservation, 'collected')}><PackageCheck size={15} /> Recogida</button>}
                          {(reservation.status === 'pending' || reservation.status === 'confirmed') && <button className="icon-button danger" type="button" disabled={changingThis} onClick={() => changeReservationStatus(reservation, 'cancelled')} aria-label="Cancelar reserva"><XCircle size={18} /></button>}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  )
}
