import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signup, signin } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import { User, Eye, EyeOff, CheckCircle, AlertCircle, Smartphone, Wifi, MapPin, Globe } from 'lucide-react';
import FarmeesLogo from '../components/common/FarmeesLogo';

export default function AuthPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'farmer',
  });
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Form validation for name, mobile and password only
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = language === 'tamil' ? 'பெயர் தேவை' : 'Name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = language === 'tamil' ? 'தொலைபேசி எண் தேவை' : 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = language === 'tamil' ? 'சரியான தொலைபேசி எண்ணை உள்ளிடவும்' : 'Enter a valid phone number';
    }
    if (!formData.password) {
      newErrors.password = language === 'tamil' ? 'கடவுச்சொல் தேவை' : 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = language === 'tamil' ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துக்களாக இருக்க வேண்டும்' : 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 15000)
    );

    try {
      let user;
      if (mode === 'signup') {
        user = await Promise.race([signup(formData.name, formData.phone, formData.password, formData.role), timeoutPromise]);
      } else {
        user = await Promise.race([signin(formData.phone, formData.password), timeoutPromise]);
      }
      // Pass ALL user data from backend response, including isDemo flag
      login({
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        district: user.district || '',
        area: user.area || '',
        language: language,
        isDemo: user.isDemo || false
      });
      const nextPath = user.role === 'coordinator' ? '/coordinator' : user.role === 'worker' ? '/worker' : '/';
      navigate(nextPath);
    } catch (err: any) {
      setErrors({ general: err.message });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Single login mode only

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-white rounded-full"></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 bg-white rounded-full"></div>
      </div>


      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <FarmeesLogo size="lg" />
            </div>
            <div className="ml-3">
              <h1 className="text-3xl font-bold text-green-800" style={{ fontFamily: language === 'tamil' ? 'Noto Sans Tamil' : 'Inter' }}>
                {t('farmease')}
              </h1>
              <p className="text-green-600 text-sm font-medium">{t('farming_made_easy')}</p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm" style={{ fontFamily: language === 'tamil' ? 'Noto Sans Tamil' : 'Inter' }}>
              {language === 'tamil'
                ? 'ஸ்மார்ட் விவசாயத்திற்கான உங்கள் பயணம் இங்கே தொடங்குகிறது!'
                : 'Your journey to smart farming starts here!'
              }
            </p>
          </div>
        </div>

        {/* Auth Mode Switch */}
        <div className="mb-4 text-center">
          <button
            type="button"
            className={`px-4 py-2 rounded-full font-medium mr-2 ${mode === 'signin' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}
            onClick={() => setMode('signin')}
          >
            {language === 'tamil' ? 'உள்நுழைக' : 'Sign In'}
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-full font-medium ${mode === 'signup' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}
            onClick={() => setMode('signup')}
          >
            {language === 'tamil' ? 'பதிவு செய்க' : 'Sign Up'}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-1">
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  placeholder={t('full_name')}
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-base ${errors.name
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-green-300'
                    }`}
                  style={{ fontFamily: language === 'tamil' ? 'Noto Sans Tamil' : 'Inter' }}
                />
                {formData.name && !errors.name && (
                  <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
                )}
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>
          )}          {/* Role Field (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-1">
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 hover:border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-base appearance-none bg-white"
                  style={{ fontFamily: language === 'tamil' ? 'Noto Sans Tamil' : 'Inter' }}
                >
                  <option value="farmer">{language === 'tamil' ? 'விவசாயி' : 'Farmer'}</option>
                  <option value="coordinator">{language === 'tamil' ? 'ஒருங்கிணைப்பாளர்' : 'Labour Coordinator'}</option>
                  <option value="worker">{language === 'tamil' ? 'தொழிலாளர்' : 'Farm Worker'}</option>
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}          {/* Mobile Number */}
          <div className="space-y-1">
            <div className="relative">
              <Smartphone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                placeholder={language === 'tamil' ? 'தொலைபேசி எண்' : 'Phone Number'}
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-base ${errors.phone
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 hover:border-green-300'
                  }`}
              />
              {formData.phone && !errors.phone && (
                <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
              )}
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.phone}
              </p>
            )}
          </div>
          {/* Password */}
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder={language === 'tamil' ? 'கடவுச்சொல்' : 'Password'}
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-12 pr-12 py-3.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-base ${errors.password
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 hover:border-green-300'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.password}
              </p>
            )}
          </div>
          {/* General error */}
          {errors.general && (
            <p className="text-red-500 text-sm text-center">{errors.general}</p>
          )}
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-medium transition-all duration-200 transform ${isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95'
              } text-white shadow-lg flex items-center justify-center`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {language === 'tamil' ? 'செயலாக்குகிறது...' : 'Processing...'}
              </>
            ) : (
              mode === 'signup' ? (language === 'tamil' ? 'பதிவு செய்க' : 'Sign Up') : t('login')
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 space-y-4">
          {/* Terms of Service */}
          <div className="text-center text-sm text-gray-600">
            <p style={{ fontFamily: language === 'tamil' ? 'Noto Sans Tamil' : 'Inter' }}>
              {t('terms_of_service')}
            </p>
          </div>

          {/* Features Preview */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2" style={{ fontFamily: language === 'tamil' ? 'Noto Sans Tamil' : 'Inter' }}>
              {language === 'tamil' ? 'ஃபார்மீஸ் என்றால் என்ன?' : 'What is Farmees?'}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
              <div className="flex items-center">
                <Leaf className="w-3 h-3 mr-1" />
                {language === 'tamil' ? 'பயிர் பரிந்துரை' : 'Crop Recommendations'}
              </div>
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {language === 'tamil' ? 'வானிலை முன்னறிவிப்பு' : 'Weather Forecast'}
              </div>
              <div className="flex items-center">
                <Globe className="w-3 h-3 mr-1" />
                {language === 'tamil' ? 'நோய் கண்டறிதல்' : 'Disease Diagnosis'}
              </div>
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {language === 'tamil' ? 'விவசாயிகள் சமூகம்' : 'Farmer Community'}
              </div>
            </div>
          </div>

          {/* Language Switch Info */}
          <div className="text-center text-xs text-gray-500">
            <p style={{ fontFamily: language === 'tamil' ? 'Noto Sans Tamil' : 'Inter' }}>
              {language === 'tamil'
                ? 'உங்கள் மொழி விருப்பத்தை மேலே மாற்றலாம்'
                : 'You can change your language preference above'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}