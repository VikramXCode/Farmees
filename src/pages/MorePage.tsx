import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  Moon,
  Smartphone,
  Info,
  Heart,
  Star,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitch from '../components/common/LanguageSwitch';
import { clearAppDataCache } from '../utils/clearCache';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  action?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

export default function MorePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const t = {
    more: language === 'english' ? 'More' : 'மேலும்',
    profile: language === 'english' ? 'Profile' : 'சுயவிவரம்',
    editProfile: language === 'english' ? 'Edit your profile' : 'உங்கள் சுயவிவரத்தைத் திருத்து',
    language: language === 'english' ? 'Language' : 'மொழி',
    languageDesc: language === 'english' ? 'English / Tamil' : 'ஆங்கிலம் / தமிழ்',
    notifications: language === 'english' ? 'Notifications' : 'அறிவிப்புகள்',
    notificationsDesc: language === 'english' ? 'Manage alerts' : 'எச்சரிக்கைகளை நிர்வகிக்கவும்',
    demoMode: language === 'english' ? 'Demo Mode' : 'டெமோ பயன்முறை',
    demoDesc: language === 'english' ? 'Using demo data' : 'டெமோ தரவைப் பயன்படுத்துதல்',
    help: language === 'english' ? 'Help & Support' : 'உதவி & ஆதரவு',
    helpDesc: language === 'english' ? 'FAQs, Contact us' : 'அடிக்கடி கேட்கப்படும் கேள்விகள், எங்களைத் தொடர்பு கொள்ளுங்கள்',
    about: language === 'english' ? 'About Farmees' : 'Farmees பற்றி',
    version: language === 'english' ? 'Version 2.0.0' : 'பதிப்பு 2.0.0',
    rateApp: language === 'english' ? 'Rate the App' : 'செயலியை மதிப்பிடுங்கள்',
    rateDesc: language === 'english' ? 'Share your feedback' : 'உங்கள் கருத்தைப் பகிரவும்',
    privacy: language === 'english' ? 'Privacy Policy' : 'தனியுரிமைக் கொள்கை',
    terms: language === 'english' ? 'Terms of Service' : 'சேவை விதிமுறைகள்',
    logout: language === 'english' ? 'Logout' : 'வெளியேறு',
    logoutDesc: language === 'english' ? 'Sign out of your account' : 'உங்கள் கணக்கிலிருந்து வெளியேறு',
    settings: language === 'english' ? 'Settings' : 'அமைப்புகள்',
    general: language === 'english' ? 'General' : 'பொது',
    support: language === 'english' ? 'Support' : 'ஆதரவு',
    clearCache: language === 'english' ? 'Clear Cache' : 'தற்காலிக சேமிப்பை அழிக்கவும்',
    clearCacheDesc: language === 'english' ? 'Clear app data & refresh' : 'செயலி தரவை அழித்து புதுப்பிக்கவும்',
    madeWith: language === 'english' ? 'Made with' : 'உருவாக்கப்பட்டது',
    forFarmers: language === 'english' ? 'for Indian farmers' : 'இந்திய விவசாயிகளுக்காக',
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };
  
  const handleClearCache = () => {
    if (confirm(language === 'english' 
      ? 'This will clear all cached data and refresh the app. Continue?' 
      : 'இது அனைத்து தற்காலிக சேமிப்பு தரவையும் அழித்து செயலியை புதுப்பிக்கும். தொடரவா?')) {
      clearAppDataCache();
    }
  };

  const profileSection: MenuItem[] = [
    {
      icon: <User className="w-5 h-5" />,
      label: t.profile,
      sublabel: t.editProfile,
      action: () => navigate('/profile'),
      rightElement: <ChevronRight className="w-5 h-5 text-text-muted" />,
    },
  ];

  const settingsSection: MenuItem[] = [
    {
      icon: <Globe className="w-5 h-5" />,
      label: t.language,
      sublabel: t.languageDesc,
      rightElement: <LanguageSwitch language={language} onChange={setLanguage} />,
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: t.notifications,
      sublabel: t.notificationsDesc,
      action: () => navigate('/settings/notifications'),
      rightElement: <ChevronRight className="w-5 h-5 text-text-muted" />,
    },
    {
      icon: <Trash2 className="w-5 h-5" />,
      label: t.clearCache,
      sublabel: t.clearCacheDesc,
      action: handleClearCache,
      rightElement: <ChevronRight className="w-5 h-5 text-text-muted" />,
    },
  ];

  const supportSection: MenuItem[] = [
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: t.help,
      sublabel: t.helpDesc,
      action: () => navigate('/help'),
      rightElement: <ChevronRight className="w-5 h-5 text-text-muted" />,
    },
    {
      icon: <Star className="w-5 h-5" />,
      label: t.rateApp,
      sublabel: t.rateDesc,
      action: () => {},
      rightElement: <ChevronRight className="w-5 h-5 text-text-muted" />,
    },
    {
      icon: <Info className="w-5 h-5" />,
      label: t.about,
      sublabel: t.version,
      action: () => navigate('/about'),
      rightElement: <ChevronRight className="w-5 h-5 text-text-muted" />,
    },
  ];

  const logoutSection: MenuItem[] = [
    {
      icon: <LogOut className="w-5 h-5" />,
      label: t.logout,
      sublabel: t.logoutDesc,
      action: handleLogout,
      danger: true,
    },
  ];

  const renderMenuSection = (items: MenuItem[], title?: string) => (
    <div className="mb-6">
      {title && (
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-4 mb-2">
          {title}
        </h3>
      )}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
              item.danger ? 'text-danger-600' : 'text-text-primary'
            }`}
            disabled={!item.action}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                item.danger
                  ? 'bg-danger-50 text-danger-600'
                  : 'bg-farm-primary-50 text-farm-primary-600'
              }`}>
                {item.icon}
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{item.label}</p>
                {item.sublabel && (
                  <p className={`text-xs ${item.danger ? 'text-danger-400' : 'text-text-muted'}`}>
                    {item.sublabel}
                  </p>
                )}
              </div>
            </div>
            {item.rightElement}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="app-container py-4">
      {/* User Card */}
      <div className="bg-gradient-to-br from-farm-primary-500 to-farm-primary-700 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl">
              {user?.name?.charAt(0)?.toUpperCase() || '👤'}
            </div>
            <div>
              <h2 className="text-lg font-bold">{user?.name}</h2>
              <p className="text-farm-primary-200 text-sm">{user?.phone}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs capitalize">
                {user?.role || 'Farmer'}
              </span>
            </div>
          </div>
          
          {/* Demo Mode Badge */}
          {user?.isDemo && (
            <div className="mt-3 p-2 bg-warning-500/20 rounded-lg flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm">{t.demoMode} - {t.demoDesc}</span>
            </div>
          )}
        </div>

        {/* Menu Sections */}
        {renderMenuSection(profileSection)}
        {renderMenuSection(settingsSection, t.settings)}
        {renderMenuSection(supportSection, t.support)}
        {renderMenuSection(logoutSection)}

        {/* Footer */}
        <div className="text-center text-text-muted text-sm py-4">
          <p className="flex items-center justify-center gap-1">
            {t.madeWith} <Heart className="w-4 h-4 text-danger-500 fill-current" /> {t.forFarmers}
          </p>
          <p className="text-xs mt-1">© 2026 Farmees</p>
        </div>
    </div>
  );
}
