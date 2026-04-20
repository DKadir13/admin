import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<MainDashboardPage />} />
        <Route path="/internal" element={<InternalPage />} />
        <Route path="/sites" element={<SiteSelectPage />} />
        <Route path="/sites/:siteId" element={<SiteLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="domains" element={<DomainsPage />} />
          <Route path="settings" element={<SiteSettingsPage />} />
        </Route>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

