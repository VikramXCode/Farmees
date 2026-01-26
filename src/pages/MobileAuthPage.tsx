import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  Briefcase,
  Tractor,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/common/Button';
import LanguageSwitch from '../components/common/LanguageSwitch';
import FarmeesLogo from '../components/common/FarmeesLogo';

type AuthMode = 'login' | 'signup';
type UserRole = 'farmer' | 'coordinator' | 'worker';

export default function MobileAuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [mode, setMode] = useState<AuthMode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    title: language === 'english' ? 'Farmees' : 'பார்மீஸ்',
    subtitle: language === 'english' ? 'Smart farming for everyone' : 'அனைவருக்கும் ஸ்மார்ட் விவசாயம்',
    login: language === 'english' ? 'Login' : 'உள்நுழைய',
    signup: language === 'english' ? 'Sign Up' : 'பதிவு செய்க',
    phone: language === 'english' ? 'Phone Number' : 'தொலைபேசி எண்',
    password: language === 'english' ? 'Password' : 'கடவுச்சொல்',
    name: language === 'english' ? 'Full Name' : 'முழு பெயர்',
    selectRole: language === 'english' ? 'I am a...' : 'நான் ஒரு...',
    farmer: language === 'english' ? 'Farmer' : 'விவசாயி',
    coordinator: language === 'english' ? 'Coordinator' : 'ஒருங்கிணைப்பாளர்',
    worker: language === 'english' ? 'Worker' : 'தொழிலாளி',
    noAccount: language === 'english' ? "Don't have an account?" : 'கணக்கு இல்லையா?',
    hasAccount: language === 'english' ? 'Already have an account?' : 'ஏற்கனவே கணக்கு உள்ளதா?',
    demoMode: language === 'english' ? 'Try Demo' : 'டெமோவை முயற்சி செய்',
    or: language === 'english' ? 'or' : 'அல்லது',
  };

  const roles = [
    { id: 'farmer', label: t.farmer, icon: Tractor, description: language === 'english' ? 'Manage your farm' : 'உங்கள் பண்ணையை நிர்வகிக்கவும்' },
    { id: 'coordinator', label: t.coordinator, icon: Briefcase, description: language === 'english' ? 'Manage labour' : 'தொழிலாளர்களை நிர்வகிக்கவும்' },
    { id: 'worker', label: t.worker, icon: User, description: language === 'english' ? 'Find work' : 'வேலை தேடுங்கள்' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(phone, password);
      } else {
        await register({ name, phone, password, role });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || (language === 'english' ? 'Something went wrong' : 'ஏதோ தவறு நடந்தது'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Demo credentials based on selected role - matches seeded demo users
      const demoCredentials = {
        farmer: { phone: '9999000001', password: 'demo123' },
        coordinator: { phone: '9999000002', password: 'demo123' },
        worker: { phone: '9999000003', password: 'demo123' },
      };
      const creds = demoCredentials[role];
      await login(creds.phone, creds.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-farm-primary-600 to-farm-primary-800 flex flex-col">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
          <LanguageSwitch language={language} onChange={setLanguage} />
        </div>
      </div>

      {/* Logo Section */}
      <div className="pt-16 pb-8 px-6 text-center text-white">
        <div className="mx-auto mb-4 flex items-center justify-center">
          <FarmeesLogo size="xl" />
        </div>
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-farm-primary-200">{t.subtitle}</p>
      </div>

      {/* Auth Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-safe-bottom">
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'login'
                ? 'bg-white text-farm-primary-600 shadow-sm'
                : 'text-text-muted'
            }`}
          >
            {t.login}
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'signup'
                ? 'bg-white text-farm-primary-600 shadow-sm'
                : 'text-text-muted'
            }`}
          >
            {t.signup}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field - Signup Only */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {t.name}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-farm-primary-500 focus:border-transparent outline-none"
                  placeholder={language === 'english' ? 'Enter your name' : 'உங்கள் பெயரை உள்ளிடவும்'}
                  required
                />
              </div>
            </div>
          )}

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              {t.phone}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-farm-primary-500 focus:border-transparent outline-none"
                placeholder="9876543210"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              {t.password}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-farm-primary-500 focus:border-transparent outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Role Selector - Signup Only */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t.selectRole}
              </label>
              <div className="space-y-2">
                {roles.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as UserRole)}
                      className={`w-full flex items-center p-3 rounded-xl border-2 transition-all ${
                        role === r.id
                          ? 'border-farm-primary-500 bg-farm-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        role === r.id ? 'bg-farm-primary-100 text-farm-primary-600' : 'bg-gray-100 text-text-muted'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="ml-3 text-left flex-1">
                        <p className={`font-semibold ${role === r.id ? 'text-farm-primary-700' : 'text-text-primary'}`}>
                          {r.label}
                        </p>
                        <p className="text-xs text-text-muted">{r.description}</p>
                      </div>
                      {role === r.id && (
                        <div className="w-5 h-5 bg-farm-primary-500 rounded-full flex items-center justify-center">
                          <ChevronRight className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            className="mt-6"
          >
            {mode === 'login' ? t.login : t.signup}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-4 text-sm text-text-muted">{t.or}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Demo Mode Button */}
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={handleDemoLogin}
          loading={loading}
        >
          {t.demoMode}
        </Button>

        {/* Switch Mode Link */}
        <p className="text-center mt-6 text-sm text-text-muted">
          {mode === 'login' ? t.noAccount : t.hasAccount}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-farm-primary-600 font-semibold hover:underline"
          >
            {mode === 'login' ? t.signup : t.login}
          </button>
        </p>
      </div>
    </div>
  );
}
