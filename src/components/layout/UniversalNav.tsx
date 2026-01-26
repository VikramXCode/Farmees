/**
 * Universal Navigation Component
 * 
 * Single navigation system for ALL devices:
 * - Bottom-aligned on all screens
 * - Same icons, same labels
 * - Centered within max-width container on large screens
 * - No sidebar, no separate desktop nav
 */

import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Users, Globe, Menu, Briefcase } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  name: string;
  icon: typeof Home;
  path: string;
}

export default function UniversalNav() {
  const location = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();

  const isCoordinator = user?.role === 'coordinator';
  const isWorker = user?.role === 'worker';

  // Same navigation items for all screen sizes
  const getNavItems = (): NavItem[] => {
    if (isCoordinator) {
      return [
        { name: language === 'english' ? 'Dashboard' : 'டாஷ்போர்டு', icon: Home, path: '/coordinator' },
        { name: language === 'english' ? 'Requests' : 'கோரிக்கைகள்', icon: Briefcase, path: '/coordinator/requests' },
        { name: language === 'english' ? 'Connect' : 'இணைப்பு', icon: Globe, path: '/connect' },
        { name: language === 'english' ? 'More' : 'மேலும்', icon: Menu, path: '/more' },
      ];
    }
    
    if (isWorker) {
      return [
        { name: language === 'english' ? 'Jobs' : 'வேலைகள்', icon: Home, path: '/worker' },
        { name: language === 'english' ? 'History' : 'வரலாறு', icon: Briefcase, path: '/worker/history' },
        { name: language === 'english' ? 'Connect' : 'இணைப்பு', icon: Globe, path: '/connect' },
        { name: language === 'english' ? 'More' : 'மேலும்', icon: Menu, path: '/more' },
      ];
    }

    // Farmer navigation (default)
    return [
      { name: language === 'english' ? 'Home' : 'முகப்பு', icon: Home, path: '/' },
      { name: language === 'english' ? 'AI' : 'AI', icon: MessageSquare, path: '/ai' },
      { name: language === 'english' ? 'Labour' : 'தொழிலாளர்', icon: Users, path: '/labour' },
      { name: language === 'english' ? 'Connect' : 'இணைப்பு', icon: Globe, path: '/connect' },
      { name: language === 'english' ? 'More' : 'மேலும்', icon: Menu, path: '/more' },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      {/* Centered container matching app max-width */}
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-around items-center h-16 app-container">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-primary-500'
                }`}
              >
                <Icon
                  className="w-6 h-6 mb-1"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
