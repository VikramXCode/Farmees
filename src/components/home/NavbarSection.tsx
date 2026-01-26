import { Plus, Lightbulb, Bug, TrendingUp, Cloud, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import FarmeesLogo from '../common/FarmeesLogo';

interface NavbarSectionProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function NavbarSection({ activeSection, setActiveSection }: NavbarSectionProps) {
  const { t } = useLanguage();
  
  const sections = [
    { id: 'add-land', name: t('add_land'), icon: Plus },
    { id: 'crop-rec', name: t('crop_recommendation'), icon: Lightbulb },
    { id: 'disease', name: t('disease_diagnosis'), icon: Bug },
    { id: 'market', name: t('market_analysis'), icon: TrendingUp },
    { id: 'weather', name: t('weather_forecast'), icon: Cloud },
    { id: 'schemes', name: t('schemes'), icon: FileText },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'add-land':
        return <AddLandForm onClose={() => setActiveSection('')} />;
      case 'crop-rec':
        return <CropRecommendation />;
      case 'disease':
        return <DiseaseDiagnosis />;
      case 'market':
        return <MarketAnalysis />;
      case 'weather':
        return <WeatherForecast />;
      case 'schemes':
        return <GovernmentSchemes />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Navigation Bar */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 p-4">
        <div className="mb-3 flex items-center gap-2">
          <FarmeesLogo size="sm" />
          <div className="text-white font-semibold">Farmees</div>
        </div>
        <div className="flex space-x-2 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeSection === section.id
                  ? 'bg-white text-green-600 shadow-md'
                  : 'text-green-100 hover:text-white hover:bg-green-700'
              }`}
            >
              <section.icon className="w-4 h-4 mr-2" />
              {section.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add Land Button - Always visible when no section is selected */}
      {!activeSection && (
        <div className="p-4 border-b">
          <button
            onClick={() => setActiveSection('add-land')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('add_land')}
          </button>
        </div>
      )}

      {/* Dynamic Content */}
      {activeSection && (
        <div className="p-6">
          {renderContent()}
        </div>
      )}
    </div>
  );
}

// keep imports at bottom to preserve references used above
import AddLandForm from './AddLandForm';
import CropRecommendation from './CropRecommendation';
import DiseaseDiagnosis from './DiseaseDiagnosis';
import MarketAnalysis from './MarketAnalysis';
import WeatherForecast from './WeatherForecast';
import GovernmentSchemes from '../schemes/GovernmentSchemes';