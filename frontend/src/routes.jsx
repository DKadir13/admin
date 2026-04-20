import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './screens/LoginPage'
import MainDashboardPage from './screens/MainDashboardPage'
import InternalPage from './screens/InternalPage'
import SiteSelectPage from './screens/SiteSelectPage'
import SiteLayout from './screens/SiteLayout'
import DashboardPage from './screens/DashboardPage'
import BlogPage from './screens/BlogPage'
import ProductsPage from './screens/ProductsPage'
import DomainsPage from './screens/DomainsPage'
import SiteSettingsPage from './screens/SiteSettingsPage'
import EventsPage from './screens/EventsPage'

const isAuthenticated = () => {
  return Boolean(window.localStorage.getItem('admin_token'))
}

function PrivateRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <MainDashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/internal"
          element={
            <PrivateRoute>
              <InternalPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites"
          element={
            <PrivateRoute>
              <SiteSelectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:siteId"
          element={
            <PrivateRoute>
              <SiteLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="domains" element={<DomainsPage />} />
          <Route path="settings" element={<SiteSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

