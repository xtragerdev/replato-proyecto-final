import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Building2, Leaf, Search, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { apiRequest } from '../api/apiClient.js'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StatusState.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const roleOptions = [
  ['user', 'Usuario'],
  ['partner', 'Comercio'],
  ['admin', 'Administrador'],
]

function roleLabel(role) {
  return { user: 'Usuario', partner: 'Comercio', admin: 'Administrador' }[role] || role
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-ES').format(value || 0)
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="dashboard-metric">
      <span className="dashboard-metric-icon"><Icon size={20} aria-hidden="true" /></span>
      <div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
    </article>
  )
}

export default function AdminDashboardPage() {
  useDocumentTitle('Administración')
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [draftRoles, setDraftRoles] = useState({})
  const [notice, setNotice] = useState(null)
  const currentUserId = currentUser?.id || currentUser?._id

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await apiRequest('/users')).data,
  })
  const impactQuery = useQuery({
    queryKey: ['impact'],
    queryFn: async () => (await apiRequest('/food-packs/impact')).data,
  })

  const users = usersQuery.data || []
  const metrics = useMemo(() => ({
    total: users.length,
    users: users.filter(({ role }) => role === 'user').length,
    partners: users.filter(({ role }) => role === 'partner').length,
    admins: users.filter(({ role }) => role === 'admin').length,
  }), [users])

  const filteredUsers = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    if (!term) return users
    return users.filter((person) => [person.name, person.email, person.city, roleLabel(person.role)]
      .some((value) => value?.toLowerCase().includes(term)))
  }, [deferredSearch, users])

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => apiRequest(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
    onSuccess: ({ data }, variables) => {
      queryClient.setQueryData(['admin', 'users'], (previous = []) => previous.map((person) => (
        person._id === variables.userId ? data : person
      )))
      setDraftRoles((previous) => {
        const next = { ...previous }
        delete next[variables.userId]
        return next
      })
      setNotice({ type: 'success', text: `El rol de ${data.name} ahora es ${roleLabel(data.role).toLowerCase()}.` })
    },
    onError: (error) => setNotice({ type: 'error', text: error.message }),
  })

  function applyRole(person) {
    const nextRole = draftRoles[person._id]
    if (!nextRole || nextRole === person.role) return
    if (String(person._id) === String(currentUserId)) {
      setNotice({ type: 'error', text: 'Por seguridad, no puedes modificar tu propio rol desde este panel.' })
      return
    }
    const warning = person.role === 'admin'
      ? `Vas a retirar permisos de administrador a ${person.name}. ¿Quieres continuar?`
      : `¿Cambiar el rol de ${person.name} a ${roleLabel(nextRole).toLowerCase()}?`
    if (window.confirm(warning)) roleMutation.mutate({ userId: person._id, role: nextRole })
  }

  return (
    <section className="page-section dashboard-page admin-page">
      <div className="container">
        <header className="page-heading dashboard-heading">
          <div><p className="eyebrow">Administración</p><h1>Personas, permisos e impacto.</h1></div>
          <p>Gestiona el acceso con cuidado. Todos los cambios de rol quedan sujetos a las reglas de seguridad de la API.</p>
        </header>

        {notice && <div className={`inline-notice is-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}<button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">×</button></div>}
        {usersQuery.isLoading && <LoadingState label="Cargando usuarios…" />}
        {usersQuery.isError && <ErrorState message={usersQuery.error.message} onRetry={usersQuery.refetch} />}

        {usersQuery.data && (
          <>
            <div className="dashboard-metrics">
              <MetricCard icon={UsersRound} label="Cuentas" value={metrics.total} detail={`${metrics.users} usuarios`} />
              <MetricCard icon={Building2} label="Comercios" value={metrics.partners} detail="Cuentas partner" />
              <MetricCard icon={ShieldCheck} label="Administradores" value={metrics.admins} detail="Acceso completo" />
              <MetricCard icon={Leaf} label="Comida recuperada" value={`${formatNumber(Math.round((impactQuery.data?.foodGrams || 0) / 1000))} kg`} detail={`${formatNumber(impactQuery.data?.collectedReservations)} recogidas`} />
            </div>

            <section className="dashboard-panel" aria-labelledby="users-title">
              <div className="panel-heading admin-users-heading">
                <div><p className="eyebrow">Control de acceso</p><h2 id="users-title">Usuarios</h2></div>
                <label className="search-control compact-search">
                  <Search size={18} /><span className="sr-only">Buscar usuarios</span>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, email, ciudad o rol" />
                </label>
              </div>

              <div className="security-note"><AlertTriangle size={19} /><p><strong>Cambios conscientes.</strong> Una cuenta nueva siempre nace como usuario. Solo un administrador puede conceder permisos de comercio o administración, y nunca puede retirarse su propio acceso.</p></div>

              {!filteredUsers.length ? <EmptyState title="No hay coincidencias" text="Prueba con otro nombre, correo, ciudad o rol." /> : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table admin-users-table">
                    <thead><tr><th>Persona</th><th>Ciudad</th><th>Alta</th><th>Rol actual</th><th>Nuevo rol</th><th><span className="sr-only">Guardar cambio</span></th></tr></thead>
                    <tbody>{filteredUsers.map((person) => {
                      const isCurrentUser = String(person._id) === String(currentUserId)
                      const selectedRole = draftRoles[person._id] ?? person.role
                      const hasChanged = selectedRole !== person.role
                      const changingThis = roleMutation.isPending && roleMutation.variables?.userId === person._id
                      return (
                        <tr key={person._id}>
                          <td><div className="table-person"><span>{person.avatarUrl ? <img src={person.avatarUrl} alt="" width="42" height="42" /> : <UserRound size={19} />}</span><div><strong>{person.name}</strong><small>{person.email}</small>{isCurrentUser && <em>Tu cuenta</em>}</div></div></td>
                          <td>{person.city || 'Sin indicar'}</td>
                          <td>{formatDate(person.createdAt)}</td>
                          <td><span className={`role-badge is-${person.role}`}>{roleLabel(person.role)}</span></td>
                          <td>
                            <label className="sr-only" htmlFor={`role-${person._id}`}>Nuevo rol para {person.name}</label>
                            <select id={`role-${person._id}`} value={selectedRole} onChange={(event) => setDraftRoles((previous) => ({ ...previous, [person._id]: event.target.value }))} disabled={isCurrentUser || changingThis}>
                              {roleOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                            </select>
                          </td>
                          <td><button className="button button-secondary button-small" type="button" onClick={() => applyRole(person)} disabled={isCurrentUser || !hasChanged || changingThis}>{changingThis ? 'Guardando…' : 'Aplicar'}</button></td>
                        </tr>
                      )
                    })}</tbody>
                  </table>
                </div>
              )}
              <p className="table-summary" aria-live="polite">Mostrando {filteredUsers.length} de {users.length} cuentas.</p>
            </section>
          </>
        )}
      </div>
    </section>
  )
}
