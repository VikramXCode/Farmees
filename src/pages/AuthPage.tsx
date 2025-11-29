import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signup, signin } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import { User, Leaf, Eye, EyeOff, CheckCircle, AlertCircle, Smartphone, Wifi, MapPin, Globe } from 'lucide-react';

export default function AuthPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
  });
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Form validation for name, mobile and password only
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = language === 'malayalam' ? 'പേര് ആവശ്യമാണ്' : 'Name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = language === 'malayalam' ? 'ഫോൺ നമ്പർ ആവശ്യമാണ്' : 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = language === 'malayalam' ? 'സാധുവായ ഫോൺ നമ്പർ നൽകുക' : 'Enter a valid phone number';
    }
    if (!formData.password) {
      newErrors.password = language === 'malayalam' ? 'പാസ്‌വേഡ് ആവശ്യമാണ്' : 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = language === 'malayalam' ? 'പാസ്‌വേഡ് കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ ആയിരിക്കണം' : 'Password must be at least 6 characters';
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
    
    try {
      let user;
      if (mode === 'signup') {
        user = await signup(formData.name, formData.phone, formData.password);
      } else {
        user = await signin(formData.phone, formData.password);
      }
      login({ id: user.id, name: user.name, district: '', area: '', language });
      navigate('/');
    } catch (err: any) {
      setErrors({ general: err.message });
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

      {/* Online/Offline Status */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? <Wifi className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
          {isOnline 
            ? (language === 'malayalam' ? 'ഓൺലൈൻ' : 'Online')
            : (language === 'malayalam' ? 'ഓഫ്‌ലൈൻ' : 'Offline')
          }
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Leaf className="w-12 h-12 text-green-600 mr-3 animate-bounce-gentle" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-800" style={{ fontFamily: language === 'malayalam' ? 'Noto Sans Malayalam' : 'Inter' }}>
                {t('farmease')}
              </h1>
              <p className="text-green-600 text-sm font-medium">{t('farming_made_easy')}</p>
            </div>
          </div>
          
          {/* Welcome Message */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm" style={{ fontFamily: language === 'malayalam' ? 'Noto Sans Malayalam' : 'Inter' }}>
              {language === 'malayalam' 
                ? 'സ്മാർട്ട് കൃഷിക്ക് നിങ്ങളുടെ യാത്ര ഇവിടെ ആരംഭിക്കുന്നു!'
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
            {language === 'malayalam' ? 'ലോഗിൻ' : 'Sign In'}
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-full font-medium ${mode === 'signup' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}
            onClick={() => setMode('signup')}
          >
            {language === 'malayalam' ? 'സൈൻ അപ്പ്' : 'Sign Up'}
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
                  className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-base ${
                    errors.name 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                  style={{ fontFamily: language === 'malayalam' ? 'Noto Sans Malayalam' : 'Inter' }}
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
          )}
          {/* Mobile Number */}
          <div className="space-y-1">
            <div className="relative">
              <Smartphone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                placeholder={language === 'malayalam' ? 'ഫോൺ നമ്പർ' : 'Phone Number'}
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-base ${
                  errors.phone 
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
                placeholder={language === 'malayalam' ? 'പാസ്‌വേഡ്' : 'Password'}
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-12 pr-12 py-3.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-base ${
                  errors.password 
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
            className={`w-full py-4 rounded-xl font-medium transition-all duration-200 transform ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95'
            } text-white shadow-lg flex items-center justify-center`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {language === 'malayalam' ? 'പ്രവർത്തിക്കുന്നു...' : 'Processing...'}
              </>
            ) : (
              mode === 'signup' ? (language === 'malayalam' ? 'സൈൻ അപ്പ്' : 'Sign Up') : t('login')
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 space-y-4">
          {/* Terms of Service */}
          <div className="text-center text-sm text-gray-600">
            <p style={{ fontFamily: language === 'malayalam' ? 'Noto Sans Malayalam' : 'Inter' }}>
              {t('terms_of_service')}
            </p>
          </div>

          {/* Features Preview */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2" style={{ fontFamily: language === 'malayalam' ? 'Noto Sans Malayalam' : 'Inter' }}>
              {language === 'malayalam' ? 'എന്താണ് ഫാംഈസ്?' : 'What is FarmEase?'}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
              <div className="flex items-center">
                <Leaf className="w-3 h-3 mr-1" />
                {language === 'malayalam' ? 'വിള ശുപാർശ' : 'Crop Recommendations'}
              </div>
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {language === 'malayalam' ? 'കാലാവസ്ഥാ പ്രവചനം' : 'Weather Forecast'}
              </div>
              <div className="flex items-center">
                <Globe className="w-3 h-3 mr-1" />
                {language === 'malayalam' ? 'രോഗനിർണയം' : 'Disease Diagnosis'}
              </div>
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {language === 'malayalam' ? 'കർഷക കമ്മ്യൂണിറ്റി' : 'Farmer Community'}
              </div>
            </div>
          </div>

          {/* Language Switch Info */}
          <div className="text-center text-xs text-gray-500">
            <p style={{ fontFamily: language === 'malayalam' ? 'Noto Sans Malayalam' : 'Inter' }}>
              {language === 'malayalam' 
                ? 'നിങ്ങളുടെ ഭാഷാ മുൻഗണന മുകളിൽ മാറ്റാം'
                : 'You can change your language preference above'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}