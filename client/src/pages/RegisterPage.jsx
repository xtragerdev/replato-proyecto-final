import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Check, LockKeyhole, Mail, MapPin, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { FormField } from '../components/forms/FormField.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Escribe al menos 2 caracteres').max(80, 'El nombre es demasiado largo'),
  email: z.string().trim().min(1, 'Escribe tu correo').email('Introduce un correo válido'),
  city: z.string().trim().max(80, 'La ciudad es demasiado larga'),
  password: z.string().min(8, 'Usa al menos 8 caracteres').max(72, 'La contraseña es demasiado larga'),
  confirmPassword: z.string().min(1, 'Repite tu contraseña'),
  newsletterOptIn: z.boolean(),
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Las contraseñas no coinciden',
})

export default function RegisterPage() {
  useDocumentTitle('Crear cuenta')
  const { isAuthenticated, register: createAccount } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      city: '',
      password: '',
      confirmPassword: '',
      newsletterOptIn: false,
    },
  })

  if (isAuthenticated) return <Navigate to="/ofertas" replace />

  const onSubmit = async ({ confirmPassword: _confirmPassword, ...values }) => {
    setServerError('')
    try {
      await createAccount(values)
      const from = location.state?.from
      const target = from ? `${from.pathname || ''}${from.search || ''}${from.hash || ''}` : '/ofertas'
      navigate(target || '/ofertas', { replace: true })
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <section className="auth-page page-section">
      <div className="container auth-layout auth-layout-register">
        <div className="auth-intro">
          <p className="eyebrow">Únete a RePlato</p>
          <h1>Come bien. Ahorra. Haz que nada bueno termine en la basura.</h1>
          <ul className="benefit-list">
            <li><Check aria-hidden="true" size={18} /><span>Descubre comida de calidad con hasta un 70 % de descuento.</span></li>
            <li><Check aria-hidden="true" size={18} /><span>Reserva en segundos y recoge directamente en el comercio.</span></li>
            <li><Check aria-hidden="true" size={18} /><span>Consulta el impacto que generas con cada pack salvado.</span></li>
          </ul>
        </div>

        <div className="auth-card auth-card-wide">
          <header className="auth-card-heading">
            <h2>Crea tu cuenta</h2>
            <p>¿Ya formas parte? <Link className="text-link" to="/login" state={location.state}>Inicia sesión</Link></p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField id="register-name" label="Nombre" error={errors.name?.message}>
              <div className="input-with-icon">
                <UserRound aria-hidden="true" size={18} />
                <input id="register-name" autoComplete="name" placeholder="Tu nombre" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'register-name-error' : undefined} {...register('name')} />
              </div>
            </FormField>

            <FormField id="register-email" label="Correo electrónico" error={errors.email?.message}>
              <div className="input-with-icon">
                <Mail aria-hidden="true" size={18} />
                <input id="register-email" type="email" autoComplete="email" placeholder="tu@correo.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} {...register('email')} />
              </div>
            </FormField>

            <FormField id="register-city" label="Ciudad (opcional)" error={errors.city?.message}>
              <div className="input-with-icon">
                <MapPin aria-hidden="true" size={18} />
                <input id="register-city" autoComplete="address-level2" placeholder="Madrid" aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? 'register-city-error' : undefined} {...register('city')} />
              </div>
            </FormField>

            <div className="form-row">
              <FormField id="register-password" label="Contraseña" error={errors.password?.message} hint="Mínimo 8 caracteres.">
                <div className="input-with-icon">
                  <LockKeyhole aria-hidden="true" size={18} />
                  <input id="register-password" type="password" autoComplete="new-password" placeholder="8 caracteres o más" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'register-password-error' : 'register-password-hint'} {...register('password')} />
                </div>
              </FormField>

              <FormField id="register-confirm-password" label="Repite la contraseña" error={errors.confirmPassword?.message}>
                <div className="input-with-icon">
                  <LockKeyhole aria-hidden="true" size={18} />
                  <input id="register-confirm-password" type="password" autoComplete="new-password" placeholder="Repite la contraseña" aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined} {...register('confirmPassword')} />
                </div>
              </FormField>
            </div>

            <label className="checkbox-field">
              <input type="checkbox" {...register('newsletterOptIn')} />
              <span>Quiero recibir avisos sobre nuevas ofertas y novedades de RePlato.</span>
            </label>

            <p className="role-note">Todas las cuentas nuevas se crean con rol de cliente. Solo un administrador puede cambiar los permisos.</p>
            {serverError && <p className="form-error form-error-box" role="alert">{serverError}</p>}

            <button className="button button-accent button-block" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando tu cuenta…' : <>Crear cuenta <ArrowRight aria-hidden="true" size={18} /></>}
            </button>
            <p className="form-legal">Al crear tu cuenta aceptas el uso responsable de la plataforma y nuestra política de privacidad.</p>
          </form>
        </div>
      </div>
    </section>
  )
}
