import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-farm-primary-600 text-white hover:bg-farm-primary-700 shadow-sm',
    secondary: 'bg-farm-primary-50 text-farm-primary-700 hover:bg-farm-primary-100 border border-farm-primary-200',
    outline: 'bg-transparent text-farm-primary-600 border border-farm-primary-300 hover:bg-farm-primary-50',
    danger: 'bg-danger-50 text-danger-600 hover:bg-danger-100 border border-danger-200',
    ghost: 'bg-transparent text-text-secondary hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3.5 text-lg gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {rightIcon && !loading && rightIcon}
    </button>
  );
}

// Quick Action Button - For icon grids
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: string | number;
}

export function QuickActionButton({ icon, label, onClick, badge }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-farm-primary-300 hover:shadow-card active:scale-[0.98] transition-all relative"
    >
      {badge && (
        <span className="absolute top-2 right-2 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
      <div className="w-12 h-12 bg-farm-primary-50 text-farm-primary-600 rounded-xl flex items-center justify-center mb-2">
        {icon}
      </div>
      <span className="text-xs font-medium text-text-secondary text-center line-clamp-2">{label}</span>
    </button>
  );
}
