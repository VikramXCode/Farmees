import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  suggestions: string[] | Array<{ label: string; value: string; icon?: string }>;
  placeholder?: string;
  label?: string;
  required?: boolean;
  loading?: boolean;
  showSuggestionsOnFocus?: boolean;
  minCharsForSuggestions?: number;
  className?: string;
}

/**
 * Reusable autocomplete input component with dropdown suggestions
 */
export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = '',
  label,
  required = false,
  loading = false,
  showSuggestionsOnFocus = false,
  minCharsForSuggestions = 0,
  className = ''
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize suggestions to consistent format
  const normalizedSuggestions = suggestions.map(s => 
    typeof s === 'string' ? { label: s, value: s } : s
  );

  // Filter suggestions based on input
  const shouldShowSuggestions = showSuggestionsOnFocus || value.length >= minCharsForSuggestions;
  const displayedSuggestions = shouldShowSuggestions ? normalizedSuggestions : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: { label: string; value: string }) => {
    onChange(suggestion.value);
    if (onSelect) {
      onSelect(suggestion.value);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (showSuggestionsOnFocus || value.length >= minCharsForSuggestions) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || displayedSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < displayedSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < displayedSuggestions.length) {
          handleSuggestionClick(displayedSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Clear"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          
          {loading && (
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          )}
          
          {!loading && displayedSuggestions.length > 0 && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && displayedSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {displayedSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-2 hover:bg-green-50 transition-colors flex items-center gap-2 ${
                index === highlightedIndex ? 'bg-green-50' : ''
              }`}
            >
              {suggestion.icon && (
                <span className="text-lg">{suggestion.icon}</span>
              )}
              <span className="text-gray-800">{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && value.length >= minCharsForSuggestions && displayedSuggestions.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
          No suggestions found. You can enter a custom value.
        </div>
      )}
    </div>
  );
}
