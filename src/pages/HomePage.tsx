import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { useAuth } from '../contexts/AuthContext';
import NavbarSection from '../components/home/NavbarSection';
import LandCards from '../components/home/LandCards';
import AIAssistant from '../components/home/AIAssistant';

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('');
  const { t } = useLanguage();
  const { isLoading, loadError } = useFarm();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect coordinators to their dashboard
  useEffect(() => {
    if (user?.role === 'coordinator') {
      navigate('/coordinator');
    }
  }, [user, navigate]);

  return (
    <div className="space-y-6 pb-6">
      {(isLoading || loadError) && (
        <div className={`rounded-xl p-4 ${loadError ? 'bg-red-50 border border-red-200' : 'bg-white border border-green-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isLoading && (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-3" />
              )}
              <div>
                <p className={`text-sm font-medium ${loadError ? 'text-red-800' : 'text-green-800'}`}>
                  {loadError ? (t('loading') + ' failed') : t('loading')}
                </p>
                {loadError && (
                  <p className="text-xs text-red-700 mt-1">{loadError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar Section */}
      <NavbarSection 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Main Content - Show Land Cards by default */}
      {!activeSection && <LandCards />}
      
      {/* AI Assistant - Always visible at bottom of home */}
      <AIAssistant />
    </div>
  );
}