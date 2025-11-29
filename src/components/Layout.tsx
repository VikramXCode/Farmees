import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clock, Users, Leaf, User, Globe, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ConnectivityIndicator, { CompactConnectivityIndicator } from './ConnectivityIndicator';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const navigation = [
    { name: t('home'), href: '/', icon: Home },
    { name: t('reminders'), href: '/reminders', icon: Clock },
    { name: t('schemes'), href: '/schemes', icon: FileText },
    { name: t('connect'), href: '/connect', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-green-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Leaf className="w-8 h-8 text-green-600 mr-3" />
              <h1 className="text-xl font-bold text-green-800">{t('farmease')}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connectivity Indicator */}
              <ConnectivityIndicator className="hidden sm:flex" />
              
              {/* Removed Ollama Status Indicator */}
              
              <div className="text-sm text-gray-600">
                {t('welcome')}, <span className="font-medium text-green-700">{user?.name}</span>
              </div>
              
              {/* Language Switcher */}
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'english' | 'malayalam')}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="english">{t('english')}</option>
                  <option value="malayalam">{t('malayalam')}</option>
                </select>
              </div>
              
              <button
                onClick={logout}
                className="text-gray-500 hover:text-red-600 transition-colors"
                title={t('logout')}
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-green-100 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center py-3 px-4 transition-colors ${
                    isActive
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-500 hover:text-green-600'
                  }`}
                >
                  <item.icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
            
            {/* Mobile Connectivity Indicator */}
            <div className="flex flex-col items-center py-3 px-4">
              <CompactConnectivityIndicator />
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom padding to prevent content from hiding behind nav */}
      <div className="h-20"></div>
    </div>
  );
}