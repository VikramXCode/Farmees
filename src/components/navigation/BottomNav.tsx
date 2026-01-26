import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Users, Globe, Menu } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();

  const isCoordinator = user?.role === 'coordinator';
  const isWorker = user?.role === 'worker';
  const isFarmer = !isCoordinator && !isWorker;

  // Navigation items based on role
  const farmerNav = [
    {
      name: language === 'english' ? 'Home' : 'முகப்பு',
      icon: Home,
      path: '/',
    },
    {
      name: language === 'english' ? 'AI' : 'செயற்கை நுண்ணறிவு',
      icon: MessageSquare,
      path: '/ai',
    },
    {
      name: language === 'english' ? 'Labour' : 'தொழிலாளர்',
      icon: Users,
      path: '/labour',
    },
    {
      name: language === 'english' ? 'Connect' : 'இணைப்பு',
      icon: Globe,
      path: '/connect',
    },
    {
      name: language === 'english' ? 'More' : 'மேலும்',
      icon: Menu,
      path: '/more',
    },
  ];

  const coordinatorNav = [
    {
      name: language === 'english' ? 'Dashboard' : 'டாஷ்போர்டு',
      icon: Home,
      path: '/coordinator',
    },
    {
      name: language === 'english' ? 'Requests' : 'கோரிக்கைகள்',
      icon: Users,
      path: '/coordinator/requests',
    },
    {
      name: language === 'english' ? 'Connect' : 'இணைப்பு',
      icon: Globe,
      path: '/connect',
    },
    {
      name: language === 'english' ? 'More' : 'மேலும்',
      icon: Menu,
      path: '/more',
    },
  ];

  const workerNav = [
    {
      name: language === 'english' ? 'Jobs' : 'வேலைகள்',
      icon: Home,
      path: '/worker',
    },
    {
      name: language === 'english' ? 'History' : 'வரலாறு',
      icon: Users,
      path: '/worker/history',
    },
    {
      name: language === 'english' ? 'Connect' : 'இணைப்பு',
      icon: Globe,
      path: '/connect',
    },
    {
      name: language === 'english' ? 'More' : 'மேலும்',
      icon: Menu,
      path: '/more',
    },
  ];

  const navItems = isFarmer ? farmerNav : isCoordinator ? coordinatorNav : workerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                  isActive
                    ? 'text-farm-primary-600'
                    : 'text-gray-600 hover:text-farm-primary-500'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
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
