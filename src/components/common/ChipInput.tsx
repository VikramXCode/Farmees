import React from 'react';

interface ChipInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  suggestions: Array<{ name: string; tamilName?: string; icon?: string }>;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  language?: 'english' | 'tamil';
}

/**
 * Input with clickable chip suggestions displayed above the input
 * Useful for quick-select scenarios (e.g., common crops for a district)
 */
export default function ChipInput({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = '',
  label,
  required = false,
  className = '',
  language = 'english'
}: ChipInputProps) {
  const handleChipClick = (chipValue: string) => {
    onChange(chipValue);
    if (onSelect) {
      onSelect(chipValue);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Chip Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">
            {language === 'english' ? 'Quick select (based on location):' : 'விரைவு தேர்வு (இடத்தின் அடிப்படையில்):'}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleChipClick(suggestion.name)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium hover:bg-green-100 transition-colors border border-green-200 shadow-sm hover:shadow-md"
              >
                {suggestion.icon && <span>{suggestion.icon}</span>}
                <span>{language === 'tamil' && suggestion.tamilName ? suggestion.tamilName : suggestion.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
      />
    </div>
  );
}
