import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FarmProvider } from './contexts/FarmContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Universal layout component
import AppShell from './components/layout/AppShell';

// Pages
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import RemindersPage from './pages/RemindersPage';
import SchemesPage from './pages/SchemesPage';
import ConnectPage from './pages/ConnectPage';
import LabourPage from './pages/LabourPage';
import CoordinatorPage from './pages/CoordinatorPage';
import WorkerPage from './pages/WorkerPage';
import MobileAuthPage from './pages/MobileAuthPage';
import FarmerDashboard from './pages/FarmerDashboard';
import AIPage from './pages/AIPage';
import MorePage from './pages/MorePage';
import DiagnosePage from './pages/DiagnosePage';
import AddLandPage from './pages/AddLandPage';
import MarketPage from './pages/MarketPage';
import SoilReportPage from './pages/SoilReportPage';
import WeatherPage from './pages/WeatherPage';
import AnalyticsPage from './pages/AnalyticsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-green-700 text-lg">Loading...</div>;

  if (!user) return <Navigate to="/auth" replace />;

  const path = location.pathname;
  const allowedByRole: Record<string, string[]> = {
    farmer: ['/', '/reminders', '/schemes', '/connect', '/labour', '/ai', '/more', '/add-land', '/diagnose', '/soil-report', '/market', '/weather', '/analytics', '/profile', '/help', '/about'],
    coordinator: ['/coordinator', '/connect', '/more'],
    worker: ['/worker', '/connect', '/more']
  };

  const allowed = allowedByRole[user.role] || ['/', '/connect'];
  const isAllowed = allowed.some((base) => path === base || path.startsWith(base + '/'));
  if (!isAllowed) {
    const redirectTo = user.role === 'coordinator' ? '/coordinator' : user.role === 'worker' ? '/worker' : '/';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <FarmProvider>
          <Router>
            <Routes>
              {/* Auth Route - No navigation */}
              <Route path="/auth" element={<MobileAuthPage />} />
              
              {/* All protected routes use AppShell (which includes nav) */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppShell>
                    <FarmerDashboard />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/ai" element={
                <ProtectedRoute>
                  <AppShell>
                    <AIPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/more" element={
                <ProtectedRoute>
                  <AppShell>
                    <MorePage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/diagnose" element={
                <ProtectedRoute>
                  <AppShell>
                    <DiagnosePage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/add-land" element={
                <ProtectedRoute>
                  <AppShell>
                    <AddLandPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/market" element={
                <ProtectedRoute>
                  <AppShell>
                    <MarketPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/soil-report" element={
                <ProtectedRoute>
                  <AppShell>
                    <SoilReportPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/weather" element={
                <ProtectedRoute>
                  <AppShell>
                    <WeatherPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/analytics" element={
                <ProtectedRoute>
                  <AppShell>
                    <AnalyticsPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/reminders" element={
                <ProtectedRoute>
                  <AppShell>
                    <RemindersPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/schemes" element={
                <ProtectedRoute>
                  <AppShell>
                    <SchemesPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/connect" element={
                <ProtectedRoute>
                  <AppShell>
                    <ConnectPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/labour" element={
                <ProtectedRoute>
                  <AppShell>
                    <LabourPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/coordinator" element={
                <ProtectedRoute>
                  <AppShell>
                    <CoordinatorPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              <Route path="/worker" element={
                <ProtectedRoute>
                  <AppShell>
                    <WorkerPage />
                  </AppShell>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </FarmProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;