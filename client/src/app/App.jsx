import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { LoadingState } from '../components/common/StatusState.jsx'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import { ProtectedRoute, RoleRoute } from '../routes/RouteGuards.jsx'

const HomePage = lazy(() => import('../pages/HomePage.jsx'))
const ExplorePage = lazy(() => import('../pages/ExplorePage.jsx'))
const FoodPackPage = lazy(() => import('../pages/FoodPackPage.jsx'))
const HowItWorksPage = lazy(() => import('../pages/HowItWorksPage.jsx'))
const LoginPage = lazy(() => import('../pages/LoginPage.jsx'))
const RegisterPage = lazy(() => import('../pages/RegisterPage.jsx'))
const ReservationsPage = lazy(() => import('../pages/ReservationsPage.jsx'))
const PartnerDashboardPage = lazy(() => import('../pages/PartnerDashboardPage.jsx'))
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage.jsx'))
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage.jsx'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'))

export function App() {
  return (
    <Suspense fallback={<LoadingState label="Preparando RePlato…" />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="ofertas" element={<ExplorePage />} />
          <Route path="ofertas/:id" element={<FoodPackPage />} />
          <Route path="como-funciona" element={<HowItWorksPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="registro" element={<RegisterPage />} />
          <Route path="sin-permiso" element={<ForbiddenPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="mis-reservas" element={<ReservationsPage />} />
            <Route element={<RoleRoute roles={['partner', 'admin']} />}>
              <Route path="partner" element={<PartnerDashboardPage />} />
            </Route>
            <Route element={<RoleRoute roles={['admin']} />}>
              <Route path="admin" element={<AdminDashboardPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
