/**
 * ExpenseEntryModal Component
 * Modal form for adding and editing expenses
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  createExpense,
  updateExpense,
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
  type CreateExpenseRequest,
} from '../../services/expenseService';

interface ExpenseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  expense?: Expense | null; // For edit mode
  onSuccess: () => void;
  activities?: Array<{ _id: string; activityType: string; description: string }>;
}

const ExpenseEntryModal: React.FC<ExpenseEntryModalProps> = ({
  isOpen,
  onClose,
  planId,
  expense,
  onSuccess,
  activities = [],
}) => {
  const { language } = useLanguage();
  const isEditMode = !!expense;

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [activityId, setActivityId] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form with expense data in edit mode
  useEffect(() => {
    if (isEditMode && expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setDate(expense.date.split('T')[0]); // Convert ISO to YYYY-MM-DD
      setDescription(expense.description);
      setNotes(expense.notes || '');
      setActivityId(expense.activityId || '');
    } else {
      // Reset form for add mode
      resetForm();
    }
  }, [expense, isEditMode]);

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]); // Today's date
    setDescription('');
    setNotes('');
    setActivityId('');
    setError('');
    setValidationErrors({});
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // Amount validation
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum)) {
      errors.amount = language === 'tamil' ? 'தொகை தேவை' : 'Amount is required';
    } else if (amountNum <= 0) {
      errors.amount = language === 'tamil' ? 'தொகை 0க்கு மேல் இருக்க வேண்டும்' : 'Amount must be greater than 0';
    }

    // Category validation
    if (!category) {
      errors.category = language === 'tamil' ? 'வகை தேவை' : 'Category is required';
    }

    // Date validation
    if (!date) {
      errors.date = language === 'tamil' ? 'தேதி தேவை' : 'Date is required';
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      if (selectedDate > today) {
        errors.date = language === 'tamil' ? 'எதிர்கால தேதி அனுமதிக்கப்படவில்லை' : 'Future date not allowed';
      }
    }

    // Description validation
    if (!description.trim()) {
      errors.description = language === 'tamil' ? 'விவரம் தேவை' : 'Description is required';
    } else if (description.trim().length < 2) {
      errors.description = language === 'tamil' ? 'விவரம் குறைந்தது 2 எழுத்துகள் இருக்க வேண்டும்' : 'Description must be at least 2 characters';
    } else if (description.trim().length > 200) {
      errors.description = language === 'tamil' ? 'விவரம் 200 எழுத்துகளுக்கு மிகாமல் இருக்க வேண்டும்' : 'Description must not exceed 200 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const data = {
        category: category as ExpenseCategory,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        description: description.trim(),
        notes: notes.trim() || undefined,
        activityId: activityId || undefined,
      };

      if (isEditMode && expense) {
        await updateExpense(expense._id, data);
        // Show success toast
        if (window.showToast) {
          window.showToast(
            language === 'tamil' ? 'செலவு புதுப்பிக்கப்பட்டது' : 'Expense updated successfully',
            'success'
          );
        }
      } else {
        const createData: CreateExpenseRequest = {
          planId,
          ...data,
        };
        await createExpense(createData);
        // Show success toast
        if (window.showToast) {
          window.showToast(
            language === 'tamil' ? 'செலவு சேர்க்கப்பட்டது' : 'Expense added successfully',
            'success'
          );
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || (language === 'tamil' ? 'ஏதோ தவறு நடந்தது' : 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  const text = {
    title: {
      add: { en: 'Add Expense', ta: 'செலவு சேர்' },
      edit: { en: 'Edit Expense', ta: 'செலவு திருத்து' },
    },
    amount: { en: 'Amount (₹)', ta: 'தொகை (₹)' },
    category: { en: 'Category', ta: 'வகை' },
    date: { en: 'Date', ta: 'தேதி' },
    description: { en: 'Description', ta: 'விவரம்' },
    notes: { en: 'Notes (Optional)', ta: 'குறிப்புகள் (விருப்பம்)' },
    linkActivity: { en: 'Link to Activity (Optional)', ta: 'செயல்பாட்டுடன் இணை (விருப்பம்)' },
    selectCategory: { en: 'Select category', ta: 'வகையைத் தேர்ந்தெடு' },
    selectActivity: { en: 'Select activity', ta: 'செயல்பாட்டைத் தேர்ந்தெடு' },
    cancel: { en: 'Cancel', ta: 'ரத்து' },
    save: { en: 'Save', ta: 'சேமி' },
    add: { en: 'Add', ta: 'சேர்' },
    saving: { en: 'Saving...', ta: 'சேமிக்கிறது...' },
    adding: { en: 'Adding...', ta: 'சேர்க்கிறது...' },
  };

  const t = (key: keyof typeof text): any => {
    const item = text[key];
    if (typeof item === 'object' && 'en' in item) {
      return item[language === 'tamil' ? 'ta' : 'en'];
    }
    return item;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? t('title').edit[language] : t('title').add[language]}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('amount')[language]} *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                validationErrors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {validationErrors.amount && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('category')[language]} *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                validationErrors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value="">{t('selectCategory')[language]}</option>
              {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat[language === 'tamil' ? 'labelTa' : 'labelEn']}
                </option>
              ))}
            </select>
            {validationErrors.category && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('date')[language]} *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                validationErrors.date ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {validationErrors.date && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.date}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('description')[language]} *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'tamil' ? 'எ.கா: நெல் விதைகள் வாங்கினேன்' : 'e.g., Purchased rice seeds'}
              maxLength={200}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                validationErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-1">
              {validationErrors.description && (
                <p className="text-red-500 text-xs">{validationErrors.description}</p>
              )}
              <p className="text-gray-400 text-xs ml-auto">{description.length}/200</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('notes')[language]}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={language === 'tamil' ? 'கூடுதல் விவரங்கள்...' : 'Additional details...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          {/* Link to Activity */}
          {activities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('linkActivity')[language]}
              </label>
              <select
                value={activityId}
                onChange={(e) => setActivityId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">{t('selectActivity')[language]}</option>
                {activities.map((activity) => (
                  <option key={activity._id} value={activity._id}>
                    {activity.activityType} - {activity.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('cancel')[language]}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (isEditMode ? t('saving')[language] : t('adding')[language])
                : (isEditMode ? t('save')[language] : t('add')[language])}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseEntryModal;

// Extend window for toast notifications
declare global {
  interface Window {
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  }
}
