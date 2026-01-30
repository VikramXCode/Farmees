import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newDate: string, reason: string, note: string) => void;
  currentDate: string;
}

export default function RescheduleModal({ isOpen, onClose, onSubmit, currentDate }: RescheduleModalProps) {
  const { language } = useLanguage();
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const reasons = [
    { value: 'rain', labelEn: 'Heavy Rain Expected', labelTa: 'அதிக மழை எதிர்பார்க்கப்படுகிறது' },
    { value: 'labour', labelEn: 'Labour Not Available', labelTa: 'தொழிலாளர்கள் கிடைக்கவில்லை' },
    { value: 'budget', labelEn: 'Budget Issue', labelTa: 'பட்ஜெட் பிரச்சனை' },
    { value: 'health', labelEn: 'Health Issue', labelTa: 'உடல்நலப் பிரச்சனை' },
    { value: 'weather', labelEn: 'Bad Weather', labelTa: 'மோசமான வானிலை' },
    { value: 'other', labelEn: 'Other Reason', labelTa: 'வேறு காரணம்' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDate && reason) {
      onSubmit(newDate, reason, note);
      // Reset form
      setNewDate('');
      setReason('');
      setNote('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            <h2 className="text-lg font-bold">
              {language === 'english' ? 'Reschedule Activity' : 'செயல்பாடு மாற்று'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Date Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-600 mb-1">
              {language === 'english' ? 'Current scheduled date:' : 'தற்போதைய தேதி:'}
            </p>
            <p className="font-semibold text-gray-800">
              {new Date(currentDate).toLocaleDateString(
                language === 'english' ? 'en-GB' : 'ta-IN',
                { day: 'numeric', month: 'long', year: 'numeric' }
              )}
            </p>
          </div>

          {/* New Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'english' ? 'New Date' : 'புதிய தேதி'} *
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'english' ? 'Reason for Rescheduling' : 'மாற்றுவதற்கான காரணம்'} *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">
                {language === 'english' ? 'Select a reason' : 'காரணத்தைத் தேர்ந்தெடுக்கவும்'}
              </option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {language === 'english' ? r.labelEn : r.labelTa}
                </option>
              ))}
            </select>
          </div>

          {/* Note (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'english' ? 'Additional Note (Optional)' : 'கூடுதல் குறிப்பு (விருப்பம்)'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={language === 'english' ? 'Any additional details...' : 'கூடுதல் விவரங்கள்...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              {language === 'english' ? 'Cancel' : 'ரத்து'}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {language === 'english' ? 'Reschedule' : 'மாற்று'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
