/**
 * ExpenseList Component
 * List expenses with filters, pagination, and actions
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getExpenses,
  deleteExpense,
  formatCurrency,
  getCategoryIcon,
  getCategoryLabel,
  getExportExpensesURL,
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
} from '../../services/expenseService';

interface ExpenseListProps {
  planId: string;
  onEdit: (expense: Expense) => void;
  refreshTrigger?: number;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  planId,
  onEdit,
  refreshTrigger = 0,
}) => {
  const { language } = useLanguage();

  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [skip, setSkip] = useState(0);
  const limit = 20;

  // Deletion
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load expenses
  const loadExpenses = async (reset: boolean = false) => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        limit,
        skip: reset ? 0 : skip,
      };

      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();

      const response = await getExpenses(planId, params);

      if (reset) {
        setExpenses(response.expenses);
        setSkip(0);
      } else {
        setExpenses((prev) => [...prev, ...response.expenses]);
      }

      setHasMore(response.pagination.hasMore);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and filter changes
  useEffect(() => {
    loadExpenses(true);
  }, [planId, categoryFilter, startDate, endDate, refreshTrigger]);

  // Load more
  const handleLoadMore = () => {
    const newSkip = skip + limit;
    setSkip(newSkip);
    loadExpenses(false);
  };

  // Delete expense
  const handleDelete = async (expenseId: string) => {
    try {
      setDeletingId(expenseId);
      await deleteExpense(expenseId);

      // Remove from list
      setExpenses((prev) => prev.filter((e) => e._id !== expenseId));

        if (window.showToast) {
        window.showToast(
          language === 'tamil' ? 'செலவு நீக்கப்பட்டது' : 'Expense deleted successfully',
          'success'
        );
      }      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  // Export CSV
  const handleExport = () => {
    const url = getExportExpensesURL(planId);
    window.open(url, '_blank');
  };

  const text = {
    title: { en: 'Expenses', ta: 'செலவுகள்' },
    filterCategory: { en: 'Filter by category', ta: 'வகை அடிப்படையில் வடிகட்டு' },
    allCategories: { en: 'All categories', ta: 'அனைத்து வகைகள்' },
    startDate: { en: 'Start date', ta: 'தொடக்க தேதி' },
    endDate: { en: 'End date', ta: 'முடிவு தேதி' },
    clearFilters: { en: 'Clear filters', ta: 'வடிகட்டிகளை அழி' },
    exportCSV: { en: 'Export CSV', ta: 'CSV ஏற்றுமதி' },
    noExpenses: { en: 'No expenses found', ta: 'செலவுகள் எதுவும் இல்லை' },
    noExpensesDesc: {
      en: 'Start tracking your expenses by adding your first expense.',
      ta: 'உங்கள் முதல் செலவைச் சேர்த்து செலவுகளைக் கண்காணிக்கத் தொடங்குங்கள்.',
    },
    edit: { en: 'Edit', ta: 'திருத்து' },
    delete: { en: 'Delete', ta: 'நீக்கு' },
    confirmDelete: { en: 'Delete this expense?', ta: 'இந்த செலவை நீக்கவா?' },
    cancel: { en: 'Cancel', ta: 'ரத்து' },
    loadMore: { en: 'Load more', ta: 'மேலும் ஏற்று' },
    loading: { en: 'Loading...', ta: 'ஏற்றுகிறது...' },
    deleting: { en: 'Deleting...', ta: 'நீக்குகிறது...' },
  };

  const t = (key: keyof typeof text): string => {
    const item = text[key];
    return item[language === 'tamil' ? 'ta' : 'en'];
  };

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('title')}
          </h3>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {t('exportCSV')}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          >
            <option value="">{t('allCategories')}</option>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>
                {cat.icon} {cat[language === 'tamil' ? 'labelTa' : 'labelEn']}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder={t('startDate')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder={t('endDate')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />

          {/* Clear Filters */}
          {(categoryFilter || startDate || endDate) && (
            <button
              onClick={() => {
                setCategoryFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Expense List */}
      {loading && expenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('noExpenses')}
          </h3>
          <p className="text-gray-500 text-sm">{t('noExpensesDesc')}</p>
        </div>
      ) : (
        <>
          {/* Grouped Expenses */}
          {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
            <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Date Header */}
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700">{date}</h4>
              </div>

              {/* Expenses for this date */}
              <div className="divide-y divide-gray-200">
                {dateExpenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Category Icon */}
                      <div className="flex-shrink-0 text-3xl">
                        {getCategoryIcon(expense.category)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {expense.description}
                            </h5>
                            <p className="text-sm text-gray-500">
                              {getCategoryLabel(
                                expense.category,
                                language === 'tamil' ? 'ta' : 'en'
                              )}
                            </p>
                            {expense.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                {expense.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(expense.amount)}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => onEdit(expense)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            ✏️ {t('edit')}
                          </button>
                          {confirmDeleteId === expense._id ? (
                            <>
                              <button
                                onClick={() => handleDelete(expense._id)}
                                disabled={deletingId === expense._id}
                                className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {deletingId === expense._id
                                  ? t('deleting')
                                  : t('confirmDelete')}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={deletingId === expense._id}
                                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {t('cancel')}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(expense._id)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              🗑️ {t('delete')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('loading') : t('loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExpenseList;
