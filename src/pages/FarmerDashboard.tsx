import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ChevronDown,
  Droplets,
  CloudRain,
  Leaf,
  Bug,
  TrendingUp,
  Plus,
  Camera,
  FileText,
  Coins,
  ScrollText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { PageContainer, Section } from '../components/layout/AppShell';
import { StatsGrid, ActionGrid } from '../components/layout/UniversalGrid';
import { Card, StatCard, StatusCard } from '../components/common/UniversalCards';
import Button from '../components/common/Button';

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { lands, selectedLandId, selectLand, isLoading, loadError } = useFarm();
  const [showLandSelector, setShowLandSelector] = useState(false);
  const [weatherData] = useState({
    temperature: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    rainfall: 0,
    icon: '⛅',
  });

  // Auto-select first land if none selected but lands exist
  useEffect(() => {
    if (lands.length > 0 && !selectedLandId) {
      selectLand(lands[0].id);
    }
  }, [lands, selectedLandId, selectLand]);

  // Get selected land object
  const selectedLand = lands.find((l: any) => l.id === selectedLandId) || null;

  const setSelectedLand = (land: any) => {
    selectLand(land?.id || null);
  };

  const t = {
    greeting: language === 'english' ? 'Vanakkam' : 'வணக்கம்',
    selectLand: language === 'english' ? 'Select Land' : 'நிலத்தைத் தேர்ந்தெடு',
    todayWeather: language === 'english' ? "Today's Weather" : 'இன்றைய வானிலை',
    yourFarm: language === 'english' ? 'Your Farm' : 'உங்கள் பண்ணை',
    currentCrop: language === 'english' ? 'Current Crop' : 'தற்போதைய பயிர்',
    soilHealth: language === 'english' ? 'Soil Health' : 'மண் ஆரோக்கியம்',
    pestStatus: language === 'english' ? 'Pest Status' : 'பூச்சி நிலை',
    marketPrice: language === 'english' ? 'Market Price' : 'சந்தை விலை',
    quickActions: language === 'english' ? 'Quick Actions' : 'விரைவு செயல்கள்',
    addLand: language === 'english' ? 'Add Land' : 'நிலம் சேர்',
    diagnose: language === 'english' ? 'Diagnose' : 'கண்டறி',
    soilReport: language === 'english' ? 'Soil Report' : 'மண் அறிக்கை',
    prices: language === 'english' ? 'Prices' : 'விலைகள்',
    schemes: language === 'english' ? 'Schemes' : 'திட்டங்கள்',
    getAIAdvice: language === 'english' ? 'Get AI Advice' : 'AI ஆலோசனை பெறு',
    noLand: language === 'english' ? 'No land added yet' : 'இன்னும் நிலம் சேர்க்கவில்லை',
    addFirstLand: language === 'english' ? 'Add your first land to get started' : 'தொடங்க உங்கள் முதல் நிலத்தைச் சேர்க்கவும்',
  };

  // Get greeting based on time
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'english' ? 'Good Morning' : 'காலை வணக்கம்';
    if (hour < 17) return language === 'english' ? 'Good Afternoon' : 'மதிய வணக்கம்';
    return language === 'english' ? 'Good Evening' : 'மாலை வணக்கம்';
  };

  const quickActions = [
    { icon: <Camera className="w-6 h-6" />, label: t.diagnose, path: '/diagnose', requiresLand: true },
    { icon: <BarChart3 className="w-6 h-6" />, label: language === 'english' ? 'Analytics' : 'பகுப்பாய்வு', path: '/analytics', requiresLand: false },
    { icon: <FileText className="w-6 h-6" />, label: t.soilReport, path: '/soil-report', requiresLand: true },
    { icon: <Coins className="w-6 h-6" />, label: t.prices, path: '/market', requiresLand: false },
    { icon: <ScrollText className="w-6 h-6" />, label: t.schemes, path: '/schemes', requiresLand: false },
    { icon: <Plus className="w-6 h-6" />, label: t.addLand, path: '/add-land', requiresLand: false },
  ];

  // Handle quick action click - show land selector if needed
  const handleQuickAction = (action: typeof quickActions[0]) => {
    if (action.requiresLand && !selectedLandId && lands.length > 0) {
      setShowLandSelector(true);
    } else {
      navigate(action.path);
    }
  };

  return (
    <PageContainer>
      {/* Greeting Section */}
      <Section>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{getTimeGreeting()}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {t.greeting}, {user?.name?.split(' ')[0]} 🌾
            </h1>
          </div>
        </div>
      </Section>

      {/* Loading State */}
      {isLoading && (
        <Section>
          <Card>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              <span className="ml-3 text-gray-600">
                {language === 'english' ? 'Loading your lands...' : 'உங்கள் நிலங்களை ஏற்றுகிறது...'}
              </span>
            </div>
          </Card>
        </Section>
      )}

      {/* Error State */}
      {loadError && !isLoading && (
        <Section>
          <Card>
            <div className="flex items-center gap-3 p-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{loadError}</span>
            </div>
          </Card>
        </Section>
      )}

      {/* No Lands State */}
      {!isLoading && !loadError && lands.length === 0 && (
        <Section>
          <Card>
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{t.noLand}</h3>
              <p className="text-sm text-gray-500 mb-4">{t.addFirstLand}</p>
              <Button onClick={() => navigate('/add-land')} leftIcon={<Plus className="w-4 h-4" />}>
                {t.addLand}
              </Button>
            </div>
          </Card>
        </Section>
      )}

      {/* Land Selector - Only show when lands exist */}
      {!isLoading && lands.length > 0 && (
        <Section>
        <div className="relative">
          <button
            onClick={() => setShowLandSelector(!showLandSelector)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-green-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">{t.selectLand}</p>
                <p className="font-semibold text-gray-900">
                  {selectedLand?.name || (language === 'english' ? 'No land selected' : 'நிலம் தேர்வு செய்யவில்லை')}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showLandSelector ? 'rotate-180' : ''}`} />
          </button>

          {/* Land Dropdown */}
          {showLandSelector && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-30 max-h-64 overflow-y-auto">
              {lands && lands.length > 0 ? (
                lands.map((land: any) => (
                  <button
                    key={land._id}
                    onClick={() => {
                      setSelectedLand(land);
                      setShowLandSelector(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      selectedLand?.id === land.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <MapPin className="w-5 h-5 text-green-700" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">{land.name}</p>
                      <p className="text-xs text-gray-500">{land.location}</p>
                    </div>
                    {selectedLand?.id === land.id && (
                      <CheckCircle2 className="w-5 h-5 text-green-700" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-gray-500 text-sm mb-2">{t.noLand}</p>
                  <Button size="sm" onClick={() => navigate('/add-land')}>
                    <Plus className="w-4 h-4" />
                    {t.addLand}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>
      )}

      {/* Weather Card */}
      <Section>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t.todayWeather}</p>
              <p className="text-3xl font-bold text-gray-900">{weatherData.temperature}°C</p>
              <p className="text-sm text-gray-600">{weatherData.condition}</p>
            </div>
            <div className="text-5xl">{weatherData.icon}</div>
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">{weatherData.humidity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">{weatherData.rainfall}mm</span>
            </div>
          </div>
        </Card>
      </Section>

      {/* Farm Status Cards */}
      {selectedLand && (
        <Section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t.yourFarm}</h2>
          
          <StatsGrid>
            <StatCard
              label={t.currentCrop}
              value={selectedLand.currentCrop || 'Rice'}
              sublabel={language === 'english' ? 'Growing well' : 'நன்றாக வளர்கிறது'}
              icon={Leaf}
              iconBg="bg-green-100"
              iconColor="text-green-700"
              trend={{ value: '', direction: 'up' }}
            />
            
            <StatCard
              label={t.soilHealth}
              value={language === 'english' ? 'Good' : 'நல்லது'}
              sublabel={`pH: 6.5 | N: ${language === 'english' ? 'Medium' : 'நடுத்தரம்'}`}
              icon={Droplets}
              iconBg="bg-amber-100"
              iconColor="text-amber-700"
            />
            
            <StatCard
              label={t.pestStatus}
              value={language === 'english' ? 'Low Risk' : 'குறைந்த ஆபத்து'}
              sublabel={language === 'english' ? 'No alerts' : 'எச்சரிக்கை இல்லை'}
              icon={Bug}
              iconBg="bg-green-100"
              iconColor="text-green-700"
            />
            
            <Card onClick={() => navigate('/market')}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-500">{t.marketPrice}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">₹2,150</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +5% {language === 'english' ? 'this week' : 'இந்த வாரம்'}
              </p>
            </Card>
          </StatsGrid>
        </Section>
      )}

      {/* Primary CTA - Get AI Advice */}
      <Section>
        <Button
          fullWidth
          size="lg"
          onClick={() => navigate('/ai')}
          leftIcon={<Sparkles className="w-5 h-5" />}
          className="shadow-lg"
        >
          {t.getAIAdvice}
        </Button>
      </Section>

      {/* Quick Actions Grid */}
      <Section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t.quickActions}</h2>
        
        {/* Land selector hint when no land selected */}
        {lands.length > 0 && !selectedLandId && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-amber-700">
              {language === 'english' ? 'Select a land above to access all features' : 'அனைத்து அம்சங்களையும் அணுக மேலே ஒரு நிலத்தைத் தேர்ந்தெடுக்கவும்'}
            </span>
          </div>
        )}

        <ActionGrid>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action)}
              className={`flex flex-col items-center justify-center p-4 bg-white rounded-xl border transition-all min-h-[80px] ${
                action.requiresLand && !selectedLandId && lands.length > 0
                  ? 'border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                  : 'border-gray-100 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              <div className={`mb-2 ${
                action.requiresLand && !selectedLandId && lands.length > 0 ? 'text-amber-600' : 'text-green-700'
              }`}>
                {action.icon}
              </div>
              <span className="text-xs text-gray-700 text-center font-medium">{action.label}</span>
              {action.requiresLand && !selectedLandId && lands.length > 0 && (
                <span className="text-[10px] text-amber-600 mt-1">
                  {language === 'english' ? 'Select land' : 'நிலம் தேர்வு'}
                </span>
              )}
            </button>
          ))}
        </ActionGrid>
      </Section>

      {/* Alerts Section */}
      <Section className="pb-24">
        <StatusCard
          variant="warning"
          title={language === 'english' ? 'Weather Alert' : 'வானிலை எச்சரிக்கை'}
          message={language === 'english' ? 'Light rain expected tomorrow. Plan irrigation accordingly.' : 'நாளை லேசான மழை எதிர்பார்க்கப்படுகிறது. அதற்கேற்ப நீர்ப்பாசனத்தைத் திட்டமிடுங்கள்.'}
          icon={CloudRain}
          action={{
            label: language === 'english' ? 'View Details' : 'விவரங்களைக் காண்க',
            onClick: () => navigate('/weather'),
          }}
        />
      </Section>
    </PageContainer>
  );
}
