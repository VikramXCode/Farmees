import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Modern Dashboard Component Library
 * Professional, clean, data-driven UI components
 */

// ========== STAT CARD ==========
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  size = 'md',
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-white border-slate-200',
    success: 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200',
    warning: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200',
    danger: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200',
    info: 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200',
  };

  const iconBgStyles = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  };

  const sizeStyles = {
    sm: { padding: 'p-4', value: 'text-2xl', icon: 'w-10 h-10' },
    md: { padding: 'p-5', value: 'text-3xl', icon: 'w-12 h-12' },
    lg: { padding: 'p-6', value: 'text-4xl', icon: 'w-14 h-14' },
  };

  const TrendIcon = trend?.value && trend.value > 0 ? TrendingUp : trend?.value && trend.value < 0 ? TrendingDown : Minus;
  const trendColor = trend?.value && trend.value > 0 ? 'text-emerald-600 bg-emerald-50' : trend?.value && trend.value < 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50';

  return (
    <div className={`
      ${variantStyles[variant]}
      ${sizeStyles[size].padding}
      rounded-2xl border shadow-sm
      hover:shadow-md transition-all duration-200
    `}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`${iconBgStyles[variant]} ${sizeStyles[size].icon} rounded-xl flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <span className={`${sizeStyles[size].value} font-bold text-slate-900 leading-none`}>
          {value}
        </span>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(trend.value)}%</span>
            {trend.label && <span className="text-slate-400 font-normal ml-1">{trend.label}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== DASHBOARD CARD ==========
interface DashboardCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function DashboardCard({
  children,
  title,
  subtitle,
  action,
  className = '',
  noPadding = false,
}: DashboardCardProps) {
  return (
    <div className={`
      bg-white rounded-2xl border border-slate-200 shadow-sm
      hover:shadow-md transition-shadow duration-200
      ${className}
    `}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}

// ========== CHART CARD ==========
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  height?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  action,
  height = 'h-72',
}: ChartCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={`p-6 ${height}`}>
        {children}
      </div>
    </div>
  );
}

// ========== PROGRESS CARD ==========
interface ProgressCardProps {
  title: string;
  value: number;
  max?: number;
  label?: string;
  color?: 'green' | 'blue' | 'amber' | 'red';
}

export function ProgressCard({
  title,
  value,
  max = 100,
  label,
  color = 'green',
}: ProgressCardProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorStyles = {
    green: 'from-emerald-500 to-green-500',
    blue: 'from-blue-500 to-indigo-500',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-red-500 to-rose-500',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <span className="text-sm font-bold text-slate-900">{value}/{max}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${colorStyles[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {label && <p className="text-xs text-slate-500 mt-2">{label}</p>}
    </div>
  );
}

// ========== INFO CARD ==========
interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export function InfoCard({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
}: InfoCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-slate-50',
      icon: 'bg-slate-100 text-slate-600',
      border: 'border-slate-200',
    },
    success: {
      bg: 'bg-emerald-50',
      icon: 'bg-emerald-100 text-emerald-600',
      border: 'border-emerald-200',
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'bg-amber-100 text-amber-600',
      border: 'border-amber-200',
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
      border: 'border-blue-200',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-2xl p-5`}>
      <div className="flex gap-4">
        <div className={`${styles.icon} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900">{title}</h4>
          <p className="text-sm text-slate-600 mt-1">{description}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 mt-3 inline-flex items-center gap-1"
            >
              {action.label}
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== QUICK ACTION CARD ==========
interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'gradient';
}

export function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
  variant = 'default',
}: QuickActionProps) {
  const variantStyles = {
    default: `
      bg-white border border-slate-200 
      hover:border-emerald-300 hover:shadow-md
      text-slate-900
    `,
    primary: `
      bg-emerald-50 border border-emerald-200
      hover:bg-emerald-100 hover:border-emerald-300
      text-emerald-900
    `,
    gradient: `
      bg-gradient-to-br from-emerald-500 to-green-600
      border-0 shadow-lg shadow-emerald-500/25
      hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5
      text-white
    `,
  };

  const iconStyles = {
    default: 'bg-slate-100 text-slate-600',
    primary: 'bg-emerald-200 text-emerald-700',
    gradient: 'bg-white/20 text-white',
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${variantStyles[variant]}
        w-full p-5 rounded-2xl
        flex items-center gap-4 text-left
        transition-all duration-200
      `}
    >
      <div className={`${iconStyles[variant]} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{label}</p>
        {description && (
          <p className={`text-sm mt-0.5 ${variant === 'gradient' ? 'text-emerald-100' : 'text-slate-500'}`}>
            {description}
          </p>
        )}
      </div>
    </button>
  );
}

// ========== DATA TABLE ==========
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50"
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={item.id || index}
                onClick={() => onRowClick?.(item)}
                className={`
                  ${onRowClick ? 'cursor-pointer hover:bg-emerald-50/50' : ''}
                  transition-colors duration-150
                `}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-5 py-4 text-sm text-slate-700">
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[String(col.key)] || '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ========== AVATAR ==========
interface AvatarProps {
  name: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, image, size = 'md' }: AvatarProps) {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`
        ${sizeStyles[size]}
        rounded-full bg-gradient-to-br from-emerald-500 to-green-600
        flex items-center justify-center text-white font-semibold
        shadow-md shadow-emerald-500/20
      `}
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

// ========== BADGE ==========
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
}: BadgeProps) {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    danger: 'bg-red-50 text-red-700 ring-red-600/20',
    info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-500',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        inline-flex items-center gap-1.5 font-medium rounded-full ring-1 ring-inset
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

// ========== EMPTY STATE ==========
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Icon className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mx-auto mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ========== SEARCH INPUT ==========
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
      />
    </div>
  );
}
