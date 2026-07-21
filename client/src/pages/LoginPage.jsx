import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { FormField } from '../components/forms/FormField.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Escribe tu correo').email('Introduce un correo válido'),
  password: z.string().min(1, 'Escribe tu contraseña').max(72, 'La contraseña es demasiado larga'),
})

const demoAccounts = [
  { label: 'Cliente', email: 'user@replato.test' },
  { label: 'Comercio', email: 'partner@replato.test' },
  { label: 'Admin', email: 'admin@replato.test' },
]

function defaultPathForRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'partner') return '/partner'
  return '/mis-reservas'
}

export default function LoginPage() {
  useDocumentTitle('Iniciar sesión')
  const { isAuthenticated, user, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const requestedLocation = location.state?.from
  const requestedPath = requestedLocation
    ? `${requestedLocation.pathname || ''}${requestedLocation.search || ''}${requestedLocation.hash || ''}`
    : ''

  if (isAuthenticated) return <Navigate to={requestedPath || defaultPathForRole(user?.role)} replace />

  const onSubmit = async (values) => {
    setServerError('')
    try {
      const loggedUser = await login(values)
      navigate(requestedPath || defaultPathForRole(loggedUser.role), { replace: true })
    } catch (error) {
      setServerError(error.message)
    }
  }

  const useDemoAccount = (email) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', 'RePlato2026!', { shouldValidate: true })
    setServerError('')
  }

  return (
    <section className="auth-page page-section">
      <div className="container auth-layout">
        <div className="auth-intro">
          <p className="eyebrow">Bienvenido de nuevo</p>
          <h1>Tu próxima comida ya puede estar esperándote.</h1>
          <p>Entra para reservar packs, consultar tus códigos de recogida y seguir todo lo que has ayudado a salvar.</p>
          <div className="auth-trust-note">
            <ShieldCheck aria-hidden="true" size={20} />
            <span>Acceso seguro. Nunca compartiremos tu contraseña.</span>
          </div>
        </div>

        <div className="auth-card">
          <header className="auth-card-heading">
            <h2>Iniciar sesión</h2>
            <p>¿Aún no tienes cuenta? <Link className="text-link" to="/registro" state={location.state}>Créala gratis</Link></p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField id="login-email" label="Correo electrónico" error={errors.email?.message}>
              <div className="input-with-icon">
                <Mail aria-hidden="true" size={18} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  {...register('email')}
                />
              </div>
            </FormField>

            <FormField id="login-password" label="Contraseña" error={errors.password?.message}>
              <div className="input-with-icon">
                <LockKeyhole aria-hidden="true" size={18} />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  {...register('password')}
                />
              </div>
            </FormField>

            {serverError && <p className="form-error form-error-box" role="alert">{serverError}</p>}

            <button className="button button-accent button-block" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : <>Entrar <ArrowRight aria-hidden="true" size={18} /></>}
            </button>
          </form>

          <div className="demo-access">
            <p><strong>Acceso de demostración</strong><span>Rellena las credenciales de una cuenta semilla.</span></p>
            <div className="demo-account-list">
              {demoAccounts.map((account) => (
                <button key={account.email} type="button" onClick={() => useDemoAccount(account.email)}>
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
