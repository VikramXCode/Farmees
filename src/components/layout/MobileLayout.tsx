import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import BottomNav from '../navigation/BottomNav';
import LanguageSwitch from '../common/LanguageSwitch';
import { DemoModeIndicator } from '../DemoModeIndicator';
import { Bell } from 'lucide-react';
import FarmeesLogo from '../common/FarmeesLogo';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  title?: string;
}

export default function MobileLayout({ children, showBottomNav = true, title }: MobileLayoutProps) {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isDemoUser = user?.isDemo === true;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar - Minimal */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="container-farm py-3">
          <div className="flex items-center justify-between">
            {/* Title or Logo */}
            <div className="flex items-center space-x-2">
              <FarmeesLogo size="sm" />
              {title ? (
                <h1 className="text-lg font-bold text-text-primary">{title}</h1>
              ) : (
                <h1 className="text-lg font-bold text-farm-primary-700">Farmees</h1>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>

              {/* Language Toggle */}
              <LanguageSwitch language={language} onChange={setLanguage} />
            </div>
          </div>

          {/* Demo Mode Indicator */}
          {isDemoUser && (
            <div className="mt-2">
              <DemoModeIndicator />
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Scrollable with bottom padding for nav */}
      <main className={`flex-1 overflow-y-auto ${showBottomNav ? 'pb-20' : 'pb-4'}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
