import React from 'react';
import { Shield, TrendingUp, DollarSign, FileText, ExternalLink, User, MapPin } from 'lucide-react';
import { Scheme } from '../../types/schemes';
import { useLanguage } from '../../contexts/LanguageContext';
import schemesService from '../../services/schemesService';

interface SchemeCardProps {
  scheme: Scheme;
  onViewDetails: (scheme: Scheme) => void;
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

export default function SchemeCard({ scheme, onViewDetails }: SchemeCardProps) {
  const { language, t } = useLanguage();
  const lang = language === 'tamil' ? 'ta' : 'en';

  const IconComponent = iconMap[scheme.icon as keyof typeof iconMap] || Shield;
  const categoryColor = categoryColorMap[scheme.category] || 'bg-gray-100 text-gray-800 border-gray-200';

  const handleApplyOnline = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(scheme.online_url, '_blank');
  };

  return (
    <div
      className="card-elevated hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={() => onViewDetails(scheme)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
            <IconComponent className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {schemesService.getSchemeName(scheme, lang)}
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-1 ${categoryColor}`}>
              {t(`${scheme.category}_schemes`)}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
        {schemesService.getSchemeDescription(scheme, lang)}
      </p>

      {/* Quick Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start space-x-2">
          <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-gray-600">{scheme.eligibility}</span>
        </div>
        <div className="flex items-start space-x-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-gray-600">{scheme.contact}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          className="text-green-600 text-sm font-medium hover:text-green-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(scheme);
          }}
        >
          {t('view_details')}
        </button>
        <button
          className="btn-primary text-sm py-2 px-4 flex items-center space-x-2"
          onClick={handleApplyOnline}
        >
          <span>{t('apply_online')}</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}