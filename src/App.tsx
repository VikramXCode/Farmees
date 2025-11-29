import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FarmProvider } from './contexts/FarmContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ConnectivityProvider } from './contexts/ConnectivityContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import RemindersPage from './pages/RemindersPage';
import SchemesPage from './pages/SchemesPage';
import ConnectPage from './pages/ConnectPage';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-green-700 text-lg">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/auth" />;
}

function App() {
  return (
    <LanguageProvider>
      <ConnectivityProvider>
        <AuthProvider>
          <FarmProvider>
            <Router>
              <div className="min-h-screen bg-green-50">
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout>
                        <HomePage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/reminders" element={
                    <ProtectedRoute>
                      <Layout>
                        <RemindersPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/schemes" element={
                    <ProtectedRoute>
                      <Layout>
                        <SchemesPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/connect" element={
                    <ProtectedRoute>
                      <Layout>
                        <ConnectPage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                </Routes>
              </div>
            </Router>
          </FarmProvider>
        </AuthProvider>
      </ConnectivityProvider>
    </LanguageProvider>
  );
}

export default App;