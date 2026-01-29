import React from 'react';

/**
 * FarmerCard - Clean, accessible card component
 * 
 * Design principles:
 * - High contrast borders
 * - Clear visual hierarchy
 * - Generous padding for touch
 * - Subtle shadows for depth
 */

interface FarmerCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'success' | 'warning' | 'info' | 'highlight';
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export default function FarmerCard({
  children,
  variant = 'default',
  padding = 'lg',
  onClick,
  className = '',
}: FarmerCardProps) {
  const baseStyles = `
    rounded-2xl
    transition-all duration-200
  `;

  const paddingStyles = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  const variantStyles = {
    default: `
      bg-white border border-gray-200
      shadow-sm
    `,
    elevated: `
      bg-white border border-gray-100
      shadow-lg
    `,
    success: `
      bg-gradient-to-br from-green-50 to-emerald-50
      border-2 border-green-200
    `,
    warning: `
      bg-gradient-to-br from-amber-50 to-yellow-50
      border-2 border-amber-200
    `,
    info: `
      bg-gradient-to-br from-blue-50 to-sky-50
      border-2 border-blue-200
    `,
    highlight: `
      bg-gradient-to-br from-green-500 to-emerald-600
      text-white border-0
      shadow-xl shadow-green-500/30
    `,
  };

  const interactiveStyles = onClick
    ? 'cursor-pointer hover:shadow-md active:scale-[0.99]'
    : '';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        ${baseStyles}
        ${paddingStyles[padding]}
        ${variantStyles[variant]}
        ${interactiveStyles}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * FarmerCardHeader - Header section for cards
 */
interface FarmerCardHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function FarmerCardHeader({
  icon,
  title,
  subtitle,
  action,
}: FarmerCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/**
 * FarmerCardMetric - Display key metrics in cards
 */
interface FarmerCardMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

export function FarmerCardMetric({
  label,
  value,
  unit,
  size = 'md',
}: FarmerCardMetricProps) {
  const sizeStyles = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`font-bold text-gray-900 ${sizeStyles[size]}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-gray-500">{unit}</span>
        )}
      </div>
    </div>
  );
}
