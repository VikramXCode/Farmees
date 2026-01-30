/**
 * CategoryBreakdownChart Component
 * Horizontal bar chart showing expense breakdown by category (no external libraries)
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  formatCurrency,
  getCategoryIcon,
  getCategoryLabel,
  getCategoryColor,
  type CategoryBreakdown,
} from '../../services/expenseService';

interface CategoryBreakdownChartProps {
  categoryBreakdown: CategoryBreakdown[];
  totalSpent: number;
}

const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  categoryBreakdown,
  totalSpent,
}) => {
  const { language } = useLanguage();

  // Sort by highest spend first
  const sortedCategories = [...categoryBreakdown].sort((a, b) => b.total - a.total);

  if (sortedCategories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'tamil' ? 'வகைவாரியான செலவு' : 'Category Breakdown'}
        </h3>
        <p className="text-gray-500 text-center py-8">
          {language === 'tamil' ? 'செலவுகள் எதுவும் இல்லை' : 'No expenses yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {language === 'tamil' ? 'வகைவாரியான செலவு' : 'Category Breakdown'}
      </h3>

      {/* Categories */}
      <div className="space-y-4">
        {sortedCategories.map((item) => {
          const percentage = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
          const categoryColor = getCategoryColor(item.category);

          return (
            <div key={item.category} className="space-y-2">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getCategoryIcon(item.category)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getCategoryLabel(item.category, language === 'tamil' ? 'ta' : 'en')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.count} {language === 'tamil' ? 'பொருட்கள்' : 'items'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.total)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round(percentage)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, percentage)}%`,
                    backgroundColor: categoryColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold text-gray-900">
            {language === 'tamil' ? 'மொத்தம்' : 'Total'}
          </p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(totalSpent)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryBreakdownChart;
