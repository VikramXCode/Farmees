import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * FarmerButton - Accessible, large touch target button for rural users
 * 
 * Design principles:
 * - Minimum 56px height for easy tapping
 * - High contrast colors
 * - Clear visual feedback
 * - Simple, readable text
 */

interface FarmerButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export default function FarmerButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
}: FarmerButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-3
    font-semibold rounded-2xl
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-4 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  const sizeStyles = {
    sm: 'px-4 py-2.5 text-sm min-h-[44px]',
    md: 'px-5 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px]',
    xl: 'px-8 py-5 text-xl min-h-[64px]',
  };

  const variantStyles = {
    primary: `
      bg-gradient-to-b from-green-500 to-green-600
      hover:from-green-600 hover:to-green-700
      text-white shadow-lg shadow-green-500/30
      focus:ring-green-500/50
    `,
    secondary: `
      bg-gradient-to-b from-amber-400 to-amber-500
      hover:from-amber-500 hover:to-amber-600
      text-amber-900 shadow-lg shadow-amber-500/30
      focus:ring-amber-500/50
    `,
    outline: `
      border-2 border-green-600 bg-white
      hover:bg-green-50 text-green-700
      focus:ring-green-500/50
    `,
    ghost: `
      bg-transparent hover:bg-gray-100
      text-gray-700
      focus:ring-gray-500/50
    `,
    danger: `
      bg-gradient-to-b from-red-500 to-red-600
      hover:from-red-600 hover:to-red-700
      text-white shadow-lg shadow-red-500/30
      focus:ring-red-500/50
    `,
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${widthStyles}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {rightIcon && !loading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}
