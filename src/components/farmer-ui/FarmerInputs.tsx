import React from 'react';

/**
 * FarmerInput - Accessible form input for rural users
 * 
 * Design principles:
 * - Large touch targets (min 48px height)
 * - Clear labels and placeholders
 * - High contrast borders
 * - Error states with clear messaging
 */

interface FarmerInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'tel' | 'email' | 'date';
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  icon?: React.ReactNode;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export default function FarmerInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  readOnly = false,
  icon,
  suffix,
  min,
  max,
  step,
  className = '',
}: FarmerInputProps) {
  const id = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label
        htmlFor={id}
        className="block text-base font-semibold text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          min={min}
          max={max}
          step={step}
          className={`
            w-full min-h-[56px] px-4 py-3
            text-lg text-gray-900 placeholder-gray-400
            bg-white border-2 rounded-xl
            transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${readOnly ? 'bg-gray-50 cursor-default' : ''}
            ${icon ? 'pl-12' : ''}
            ${suffix ? 'pr-16' : ''}
            ${error
              ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        />

        {/* Suffix */}
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            {suffix}
          </div>
        )}
      </div>

      {/* Helper text or error */}
      {(helperText || error) && (
        <p
          className={`text-sm ${
            error ? 'text-red-600' : 'text-gray-500'
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}

/**
 * FarmerSelect - Accessible dropdown for rural users
 */
interface FarmerSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function FarmerSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  helperText,
  error,
  required = false,
  disabled = false,
  icon,
  className = '',
}: FarmerSelectProps) {
  const id = `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label
        htmlFor={id}
        className="block text-base font-semibold text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Select container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}

        {/* Select */}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={`
            w-full min-h-[56px] px-4 py-3 pr-12
            text-lg text-gray-900
            bg-white border-2 rounded-xl
            appearance-none cursor-pointer
            transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${icon ? 'pl-12' : ''}
            ${error
              ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Helper text or error */}
      {(helperText || error) && (
        <p
          className={`text-sm ${
            error ? 'text-red-600' : 'text-gray-500'
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}

/**
 * FarmerSlider - Visual slider for pH and nutrient levels
 */
interface FarmerSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  showValue?: boolean;
  marks?: { value: number; label: string }[];
  helperText?: string;
  className?: string;
}

export function FarmerSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  showValue = true,
  marks,
  helperText,
  className = '',
}: FarmerSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and value */}
      <div className="flex justify-between items-center">
        <label className="text-base font-semibold text-gray-700">
          {label}
        </label>
        {showValue && (
          <span className="text-lg font-bold text-green-600">
            {value}
            {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
          </span>
        )}
      </div>

      {/* Slider */}
      <div className="relative pt-2 pb-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="
            w-full h-3 rounded-full appearance-none cursor-pointer
            bg-gray-200
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-7
            [&::-webkit-slider-thumb]:h-7
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-green-600
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:border-4
            [&::-webkit-slider-thumb]:border-white
            [&::-moz-range-thumb]:w-7
            [&::-moz-range-thumb]:h-7
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-green-600
            [&::-moz-range-thumb]:shadow-lg
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-4
            [&::-moz-range-thumb]:border-white
          "
          style={{
            background: `linear-gradient(to right, #16a34a 0%, #16a34a ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
          }}
        />

        {/* Marks */}
        {marks && (
          <div className="flex justify-between mt-2">
            {marks.map((mark) => (
              <span
                key={mark.value}
                className="text-xs text-gray-500"
                style={{
                  position: 'absolute',
                  left: `${((mark.value - min) / (max - min)) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {mark.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Helper text */}
      {helperText && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

/**
 * FarmerSegmentedControl - Toggle between options
 */
interface FarmerSegmentedControlProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  className?: string;
}

export function FarmerSegmentedControl({
  label,
  value,
  onChange,
  options,
  className = '',
}: FarmerSegmentedControlProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-base font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              flex-1 flex items-center justify-center gap-2
              py-3 px-4 rounded-lg
              text-base font-medium
              transition-all duration-200
              ${value === option.value
                ? 'bg-white text-green-700 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
