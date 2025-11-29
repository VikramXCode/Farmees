import React from 'react';
import { ArrowLeft, ExternalLink, Shield, TrendingUp, DollarSign, FileText, User, MapPin, Phone, Globe } from 'lucide-react';
import { Scheme } from '../../types/schemes';
import { useLanguage } from '../../contexts/LanguageContext';
import schemesService from '../../services/schemesService';

interface SchemeDetailProps {
  scheme: Scheme;
  onBack: () => void;
}

const iconMap = {
  shield: Shield,
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
  'file-text': FileText,
};

const categoryColorMap = {
  insurance: 'bg-blue-100 text-blue-800 border-blue-200',
  pricing: 'bg-green-100 text-green-800 border-green-200',
  subsidy: 'bg-purple-100 text-purple-800 border-purple-200',
  testing: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function SchemeDetail({ scheme, onBack }: SchemeDetailProps) {
  const { language, t } = useLanguage();
  const lang = language === 'malayalam' ? 'ml' : 'en';
  
  const IconComponent = iconMap[scheme.icon as keyof typeof iconMap] || Shield;
  const categoryColor = categoryColorMap[scheme.category] || 'bg-gray-100 text-gray-800 border-gray-200';

  const handleApplyOnline = () => {
    window.open(scheme.online_url, '_blank');
  };

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <IconComponent className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {schemesService.getSchemeName(scheme, lang)}
                </h1>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-1 ${categoryColor}`}>
                  {t(`${scheme.category}_schemes`)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scheme Overview */}
            <div className="card-elevated">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('scheme_details')}
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    {schemesService.getSchemeTitle(scheme, lang)}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {schemesService.getSchemeDescription(scheme, lang)}
                  </p>
                </div>
                {scheme.component && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Component</h4>
                    <p className="text-gray-600 text-sm">{scheme.component}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Eligibility */}
            <div className="card-elevated">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('eligibility')}
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {scheme.eligibility}
              </p>
            </div>

            {/* Application Process */}
            <div className="card-elevated">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('application_process')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {scheme.how_to_avail}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-elevated">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleApplyOnline}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <span>{t('apply_online')}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => window.open('tel:' + scheme.contact, '_self')}
                  className="w-full btn-outline flex items-center justify-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t('contact_info')}</span>
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card-elevated">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">
                  {t('contact_info')}
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{scheme.contact}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a 
                    href={scheme.online_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 text-sm break-all"
                  >
                    AIMS Portal
                  </a>
                </div>
              </div>
            </div>

            {/* Category Info */}
            <div className="card-elevated">
              <h3 className="font-semibold text-gray-900 mb-4">
                {t('scheme_category')}
              </h3>
              <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${categoryColor}`}>
                {t(`${scheme.category}_schemes`)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}