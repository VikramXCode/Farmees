import React from 'react';

interface LanguageSwitchProps {
  language: 'english' | 'tamil';
  onChange: (lang: 'english' | 'tamil') => void;
}

/**
 * Toggle switch for English/Tamil language selection
 */
export default function LanguageSwitch({ language, onChange }: LanguageSwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium transition-colors ${language === 'english' ? 'text-green-700' : 'text-gray-500'}`}>
        EN
      </span>
      <button
        type="button"
        onClick={() => onChange(language === 'english' ? 'tamil' : 'english')}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
          language === 'tamil' ? 'bg-green-600' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={language === 'tamil'}
        aria-label="Toggle language"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            language === 'tamil' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium transition-colors ${language === 'tamil' ? 'text-green-700' : 'text-gray-500'}`}>
        தமிழ்
      </span>
    </div>
  );
}
