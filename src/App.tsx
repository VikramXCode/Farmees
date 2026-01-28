import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FarmProvider } from './contexts/FarmContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Universal layout component
import AppShell from './components/layout/AppShell';

// Lazy-loaded Pages
const AuthPage = lazy(() => import('./pages/AuthPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const SchemesPage = lazy(() => import('./pages/SchemesPage'));
const ConnectPage = lazy(() => import('./pages/ConnectPage'));
const LabourPage = lazy(() => import('./pages/LabourPage'));
const CoordinatorPage = lazy(() => import('./pages/CoordinatorPage'));
const WorkerPage = lazy(() => import('./pages/WorkerPage'));
const MobileAuthPage = lazy(() => import('./pages/MobileAuthPage'));
const FarmerDashboard = lazy(() => import('./pages/FarmerDashboard'));
const AIPage = lazy(() => import('./pages/AIPage'));
const MorePage = lazy(() => import('./pages/MorePage'));
const DiagnosePage = lazy(() => import('./pages/DiagnosePage'));
const AddLandPage = lazy(() => import('./pages/AddLandPage'));
const MarketPage = lazy(() => import('./pages/MarketPage'));
const SoilReportPage = lazy(() => import('./pages/SoilReportPage'));
const WeatherPage = lazy(() => import('./pages/WeatherPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen text-green-700 text-lg">
    Loading...
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </Router>
        </FarmProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;