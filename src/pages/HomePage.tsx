import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import NavbarSection from '../components/home/NavbarSection';
import LandCards from '../components/home/LandCards';
import AIAssistant from '../components/home/AIAssistant';

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('');
  const { t } = useLanguage();

  return (
    <div className="space-y-6 pb-6">
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