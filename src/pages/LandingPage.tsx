import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Camera, 
  Sprout, 
  Sun, 
  CloudRain, 
  TrendingUp,
  Shield,
  Award,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FarmerButton, FarmerCard } from '../components/farmer-ui';

/**
 * LandingPage - First screen farmers see
 * 
 * Design Philosophy:
 * - Simple, clear value proposition
 * - One primary CTA
 * - Secondary option for soil report
 * - Trust indicators
 * - No overwhelming information
 */

export default function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();

  // Translations
  const t = {
    headline: language === 'english' 
      ? 'Grow the Right Crop, Earn More' 
      : 'சரியான பயிரை வளர்க்க, அதிகம் சம்பாதிக்க',
    subtext: language === 'english'
      ? 'AI-based crop recommendation using soil & climate data'
      : 'மண் மற்றும் காலநிலை தரவைப் பயன்படுத்தி AI அடிப்படையிலான பயிர் பரிந்துரை',
    primaryCta: language === 'english'
      ? 'Add Land & Get Recommendation'
      : 'நிலம் சேர்த்து பரிந்துரை பெறு',
    secondaryCta: language === 'english'
      ? 'Upload Soil Report'
      : 'மண் அறிக்கை பதிவேற்று',
    features: {
      smart: language === 'english' ? 'Smart AI Analysis' : 'ஸ்மார்ட் AI பகுப்பாய்வு',
      weather: language === 'english' ? 'Weather-Based' : 'வானிலை அடிப்படையில்',
      budget: language === 'english' ? 'Budget Planning' : 'பட்ஜெட் திட்டமிடல்',
    },
    trust: {
      farmers: language === 'english' ? '10,000+ Farmers' : '10,000+ விவசாயிகள்',
      accuracy: language === 'english' ? '95% Accuracy' : '95% துல்லியம்',
      free: language === 'english' ? '100% Free' : '100% இலவசம்',
    },
    howItWorks: language === 'english' ? 'How It Works' : 'எப்படி வேலை செய்கிறது',
    steps: [
      {
        title: language === 'english' ? 'Add Your Land' : 'உங்கள் நிலத்தைச் சேர்க்கவும்',
        desc: language === 'english' ? 'Enter location & soil details' : 'இருப்பிடம் மற்றும் மண் விவரங்களை உள்ளிடவும்',
      },
      {
        title: language === 'english' ? 'Get AI Analysis' : 'AI பகுப்பாய்வு பெறுங்கள்',
        desc: language === 'english' ? 'We analyze soil, weather & market' : 'மண், வானிலை மற்றும் சந்தையை பகுப்பாய்வு செய்கிறோம்',
      },
      {
        title: language === 'english' ? 'Grow Best Crop' : 'சிறந்த பயிரை வளர்க்கவும்',
        desc: language === 'english' ? 'Get recommendation with yield estimate' : 'விளைச்சல் மதிப்பீட்டுடன் பரிந்துரை பெறுங்கள்',
      },
    ],
    greeting: language === 'english' ? 'Welcome back' : 'மீண்டும் வரவேற்கிறோம்',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-green-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-green-800">Farmees</span>
          </div>
          {user && (
            <span className="text-sm text-gray-600">
              {t.greeting}, {user.name?.split(' ')[0]}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-20">
        {/* Hero Section */}
        <section className="pt-8 pb-6 text-center">
          {/* Illustration */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-300 rounded-full opacity-30 animate-pulse" />
            <div className="absolute inset-4 bg-gradient-to-br from-green-100 to-green-200 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Sprout className="w-20 h-20 text-green-600" />
                <Sun className="w-8 h-8 text-amber-500 absolute -top-2 -right-2" />
                <CloudRain className="w-6 h-6 text-blue-500 absolute -bottom-1 -left-3" />
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            {t.headline}
          </h1>
          
          {/* Subtext */}
          <p className="text-lg text-gray-600 mb-8 px-4">
            {t.subtext}
          </p>

          {/* Primary CTA */}
          <div className="space-y-4 px-4">
            <FarmerButton
              onClick={() => navigate('/add-land-wizard')}
              size="xl"
              fullWidth
              leftIcon={<Plus className="w-6 h-6" />}
            >
              {t.primaryCta}
            </FarmerButton>

            {/* Secondary CTA */}
            <FarmerButton
              onClick={() => navigate('/soil-report')}
              variant="outline"
              size="lg"
              fullWidth
              leftIcon={<Camera className="w-5 h-5" />}
            >
              {t.secondaryCta}
            </FarmerButton>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-bold text-gray-900">{t.trust.farmers}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-gray-900">{t.trust.accuracy}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-gray-900">{t.trust.free}</p>
            </div>
          </div>
        </section>

        {/* Feature Pills */}
        <section className="py-4">
          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <Sprout className="w-4 h-4" />
              {t.features.smart}
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <CloudRain className="w-4 h-4" />
              {t.features.weather}
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              {t.features.budget}
            </span>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            {t.howItWorks}
          </h2>
          
          <div className="space-y-3">
            {t.steps.map((step, index) => (
              <FarmerCard key={index} padding="md">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/30">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </FarmerCard>
            ))}
          </div>
        </section>

        {/* Government-style disclaimer */}
        <section className="py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  {language === 'english' 
                    ? 'Trusted by Agricultural Departments'
                    : 'விவசாய துறைகளால் நம்பகமானது'
                  }
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {language === 'english'
                    ? 'Data-driven recommendations based on Indian Agricultural Research'
                    : 'இந்திய விவசாய ஆராய்ச்சியின் அடிப்படையில் தரவு சார்ந்த பரிந்துரைகள்'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom CTA - Fixed on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-100 sm:hidden">
        <FarmerButton
          onClick={() => navigate('/add-land-wizard')}
          size="lg"
          fullWidth
          leftIcon={<Plus className="w-5 h-5" />}
        >
          {t.primaryCta}
        </FarmerButton>
      </div>
    </div>
  );
}
