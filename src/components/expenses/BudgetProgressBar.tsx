/**
 * BudgetProgressBar Component
 * Visual indicator of budget usage with color-coded alerts
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../services/expenseService';

interface BudgetProgressBarProps {
  totalBudget: number;
  totalSpent: number;
  percentageUsed: number;
  alertLevel: 'ok' | 'warning' | 'danger';
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  totalBudget,
  totalSpent,
  percentageUsed,
  alertLevel,
}) => {
  const { language } = useLanguage();

  // Color logic
  const getColor = () => {
    if (alertLevel === 'danger' || percentageUsed >= 90) return 'bg-red-500';
    if (alertLevel === 'warning' || percentageUsed >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBgColor = () => {
    if (alertLevel === 'danger' || percentageUsed >= 90) return 'bg-red-50';
    if (alertLevel === 'warning' || percentageUsed >= 70) return 'bg-yellow-50';
    return 'bg-green-50';
  };

  const getTextColor = () => {
    if (alertLevel === 'danger' || percentageUsed >= 90) return 'text-red-700';
    if (alertLevel === 'warning' || percentageUsed >= 70) return 'text-yellow-700';
    return 'text-green-700';
  };

  const getStatusText = () => {
    if (percentageUsed >= 100) {
      return {
        en: 'Budget exceeded!',
        ta: 'பட்ஜெட்டை மீறியது!',
      };
    }
    if (alertLevel === 'danger' || percentageUsed >= 90) {
      return {
        en: 'Budget critical',
        ta: 'பட்ஜெட் முக்கியம்',
      };
    }
    if (alertLevel === 'warning' || percentageUsed >= 70) {
      return {
        en: 'Budget warning',
        ta: 'பட்ஜெட் எச்சரிக்கை',
      };
    }
    return {
      en: 'Budget healthy',
      ta: 'பட்ஜெட் நல்லது',
    };
  };

  const remaining = Math.max(0, totalBudget - totalSpent);
  const statusText = getStatusText();

  return (
    <div className={`rounded-lg p-4 ${getBgColor()}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-sm font-semibold ${getTextColor()}`}>
          {language === 'tamil' ? 'பட்ஜெட் நிலை' : 'Budget Status'}
        </h3>
        <span className={`text-xs font-medium ${getTextColor()}`}>
          {statusText[language === 'tamil' ? 'ta' : 'en']}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${getColor()} transition-all duration-500 ease-out flex items-center justify-end px-2`}
          style={{ width: `${Math.min(100, percentageUsed)}%` }}
        >
          {percentageUsed >= 15 && (
            <span className="text-xs font-bold text-white">
              {Math.round(percentageUsed)}%
            </span>
          )}
        </div>
        {percentageUsed < 15 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600">
              {Math.round(percentageUsed)}%
            </span>
          </div>
        )}
      </div>

      {/* Budget Details */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        {/* Total Budget */}
        <div>
          <p className="text-gray-600 text-xs mb-1">
            {language === 'tamil' ? 'மொத்த பட்ஜெட்' : 'Total Budget'}
          </p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(totalBudget)}
          </p>
        </div>

        {/* Spent */}
        <div>
          <p className="text-gray-600 text-xs mb-1">
            {language === 'tamil' ? 'செலவு செய்த' : 'Spent'}
          </p>
          <p className={`font-semibold ${getTextColor()}`}>
            {formatCurrency(totalSpent)}
          </p>
        </div>

        {/* Remaining */}
        <div>
          <p className="text-gray-600 text-xs mb-1">
            {language === 'tamil' ? 'மீதமுள்ளது' : 'Remaining'}
          </p>
          <p className={`font-semibold ${percentageUsed >= 100 ? 'text-red-700' : 'text-green-700'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* Warning Message */}
      {percentageUsed >= 100 && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-xs text-red-700">
            {language === 'tamil'
              ? `நீங்கள் பட்ஜெட்டை ${formatCurrency(totalSpent - totalBudget)} மீறிவிட்டீர்கள்`
              : `You have exceeded the budget by ${formatCurrency(totalSpent - totalBudget)}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default BudgetProgressBar;
