/**
 * Farmees Universal Design System
 * 
 * Philosophy: ONE design that works everywhere
 * - Mobile-first base styles
 * - Same components on all devices
 * - Only spacing/width adapts naturally
 * - No device-specific switching
 */

import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import UniversalNav from './UniversalNav';
import { Bell } from 'lucide-react';
import LanguageSwitch from '../common/LanguageSwitch';
import FarmeesLogo from '../common/FarmeesLogo';

interface AppShellProps {
  children: ReactNode;
  /** Page title shown in header */
  title?: string;
  /** Hide navigation (for auth screens) */
  hideNav?: boolean;
  /** Hide header (for custom headers) */
  hideHeader?: boolean;
}

/**
 * Universal App Shell
 * 
 * Single layout container for entire app:
 * - Max width 1200px, centered
 * - Fluid padding (16px mobile → 24px larger)
 * - Bottom navigation (always visible, centered on large screens)
 * - Consistent header across all devices
 */
export default function AppShell({ 
  children, 
  title,
  hideNav = false,
  hideHeader = false,
}: AppShellProps) {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isDemoUser = user?.isDemo === true;

  return (
    <div className="min-h-screen bg-app-background">
      {/* Centered App Container */}
      <div className="max-w-[1200px] mx-auto min-h-screen flex flex-col">
        
        {/* Universal Header */}
        {!hideHeader && (
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
            <div className="app-container py-3">
              <div className="flex items-center justify-between">
                {/* Logo + Title */}
                <div className="flex items-center gap-3">
                  <FarmeesLogo size="md" />
                  <div>
                    <h1 className="text-heading-sm font-bold text-primary-700">
                      {title || 'Farmees'}
                    </h1>
                    {isDemoUser && (
                      <span className="text-xs text-warning-600 font-medium">Demo Mode</span>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                  {/* Notifications */}
                  <button className="touch-target rounded-xl hover:bg-gray-100 transition-colors relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-danger-500 rounded-full" />
                  </button>

                  {/* Language Toggle */}
                  <LanguageSwitch language={language} onChange={setLanguage} />
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 ${!hideNav ? 'pb-20' : ''}`}>
          {children}
        </main>

        {/* Universal Bottom Navigation */}
        {!hideNav && <UniversalNav />}
      </div>
    </div>
  );
}

/**
 * Page Container
 * 
 * Consistent padding wrapper for page content
 * Used inside AppShell for all pages
 */
export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`app-container py-4 space-y-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Section Component
 * 
 * Groups related content with optional title
 */
export function Section({ 
  children, 
  title, 
  action,
  className = '' 
}: { 
  children: ReactNode; 
  title?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h2 className="text-heading-sm font-bold text-gray-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
