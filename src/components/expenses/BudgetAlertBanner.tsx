/**
 * BudgetAlertBanner Component
 * Warning banner for budget alerts with dismiss functionality
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../services/expenseService';

interface BudgetAlertBannerProps {
  planId: string;
  alertLevel: 'ok' | 'warning' | 'danger';
  percentageUsed: number;
  totalSpent: number;
  remaining: number;
  totalBudget: number;
  onViewExpenses: () => void;
}

const BudgetAlertBanner: React.FC<BudgetAlertBannerProps> = ({
  planId,
  alertLevel,
  percentageUsed,
  totalSpent,
  remaining,
  totalBudget,
  onViewExpenses,
}) => {
  const { language } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  const storageKey = `budget-alert-dismissed-${planId}`;

  // Check if banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) {
      const dismissedData = JSON.parse(dismissed);
      // Auto-show again if percentage changed by more than 5% or alert level escalated
      if (
        Math.abs(dismissedData.percentage - percentageUsed) < 5 &&
        dismissedData.alertLevel === alertLevel
      ) {
        setIsDismissed(true);
      }
    }
  }, [planId, percentageUsed, alertLevel]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        percentage: percentageUsed,
        alertLevel,
        timestamp: new Date().toISOString(),
      })
    );
  };

  // Only show banner for warning or danger
  if (alertLevel === 'ok' || isDismissed) {
    return null;
  }

  const getBannerStyle = () => {
    if (alertLevel === 'danger' || percentageUsed >= 90) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: '🚨',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600',
        textColor: 'text-red-800',
        button: 'bg-red-600 hover:bg-red-700',
      };
    }
    return {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-600',
      textColor: 'text-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    };
  };

  const getMessage = () => {
    if (percentageUsed >= 100) {
      return {
        en: `You have exceeded your budget by ${formatCurrency(
          totalSpent - totalBudget
        )}. Consider reviewing your expenses.`,
        ta: `நீங்கள் உங்கள் பட்ஜெட்டை ${formatCurrency(
          totalSpent - totalBudget
        )} மீறிவிட்டீர்கள். உங்கள் செலவுகளை மதிப்பாய்வு செய்யுங்கள்.`,
      };
    }
    if (alertLevel === 'danger' || percentageUsed >= 90) {
      return {
        en: `Critical: ${Math.round(percentageUsed)}% of your budget is used. Only ${formatCurrency(
          remaining
        )} remaining out of ${formatCurrency(totalBudget)}.`,
        ta: `முக்கியம்: உங்கள் பட்ஜெட்டில் ${Math.round(percentageUsed)}% பயன்படுத்தப்பட்டுள்ளது. ${formatCurrency(
          totalBudget
        )} இல் ${formatCurrency(remaining)} மட்டுமே உள்ளது.`,
      };
    }
    return {
      en: `Warning: ${Math.round(percentageUsed)}% of your budget is used. ${formatCurrency(
        remaining
      )} remaining out of ${formatCurrency(totalBudget)}.`,
      ta: `எச்சரிக்கை: உங்கள் பட்ஜெட்டில் ${Math.round(percentageUsed)}% பயன்படுத்தப்பட்டுள்ளது. ${formatCurrency(
        totalBudget
      )} இல் ${formatCurrency(remaining)} உள்ளது.`,
    };
  };

  const style = getBannerStyle();
  const message = getMessage();

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-lg p-4 mb-4 animate-slideDown`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${style.iconBg} rounded-full p-2 flex-shrink-0`}>
          <span className="text-2xl">{style.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${style.textColor} mb-1`}>
            {alertLevel === 'danger' || percentageUsed >= 90
              ? language === 'tamil'
                ? 'பட்ஜெட் முக்கியம்'
                : 'Budget Critical'
              : language === 'tamil'
              ? 'பட்ஜெட் எச்சரிக்கை'
              : 'Budget Warning'}
          </h4>
          <p className={`text-sm ${style.textColor}`}>{message[language === 'tamil' ? 'ta' : 'en']}</p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={onViewExpenses}
              className={`px-4 py-2 ${style.button} text-white text-sm font-medium rounded-lg transition-colors`}
            >
              {language === 'tamil' ? 'செலவுகளைப் பார்' : 'View Expenses'}
            </button>
            <button
              onClick={handleDismiss}
              className={`px-4 py-2 bg-white ${style.textColor} text-sm font-medium rounded-lg border ${style.border} hover:bg-gray-50 transition-colors`}
            >
              {language === 'tamil' ? 'நிராகரி' : 'Dismiss'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className={`${style.textColor} hover:opacity-70 flex-shrink-0`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default BudgetAlertBanner;

// Add animation styles to index.css if not already present
// @keyframes slideDown {
//   from {
//     transform: translateY(-20px);
//     opacity: 0;
//   }
//   to {
//     transform: translateY(0);
//     opacity: 1;
//   }
// }
// .animate-slideDown {
//   animation: slideDown 0.3s ease-out;
// }
