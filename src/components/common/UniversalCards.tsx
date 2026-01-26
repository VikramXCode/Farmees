/**
 * Universal Card Components
 * 
 * Same structure on ALL devices - no variations
 * Only width adapts based on container
 */

import { ReactNode } from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

/* ==============================================
   BASE CARD
   ============================================== */

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };
  
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={`
        card ${paddings[padding]}
        ${onClick ? 'card-interactive text-left w-full' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

/* ==============================================
   STAT CARD - For metrics display
   ============================================== */

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconBg = 'bg-primary-100',
  iconColor = 'text-primary-600',
  trend,
  onClick,
}: StatCardProps) {
  return (
    <Card onClick={onClick} className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-caption text-muted mb-1">{label}</p>
        <p className="text-heading-md font-bold text-gray-900 truncate">{value}</p>
        {sublabel && <p className="text-caption text-muted mt-1">{sublabel}</p>}
        {trend && (
          <p className={`text-caption font-medium mt-1 ${trend.direction === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      {Icon && (
        <div className={`${iconBg} ${iconColor} p-3 rounded-xl flex-shrink-0 ml-3`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </Card>
  );
}

/* ==============================================
   ACTION CARD - Clickable with arrow
   ============================================== */

interface ActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  onClick: () => void;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info';
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  iconBg = 'bg-primary-100',
  iconColor = 'text-primary-600',
  onClick,
  badge,
  badgeVariant = 'info',
}: ActionCardProps) {
  const badgeColors = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  };

  return (
    <Card onClick={onClick} className="flex items-center gap-3">
      <div className={`${iconBg} ${iconColor} p-3 rounded-xl flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 truncate">{title}</p>
          {badge && <span className={`badge ${badgeColors[badgeVariant]}`}>{badge}</span>}
        </div>
        {description && <p className="text-body-sm text-secondary truncate">{description}</p>}
      </div>
      <ChevronRight className="w-5 h-5 text-muted flex-shrink-0" />
    </Card>
  );
}

/* ==============================================
   STATUS CARD - For alerts/notifications
   ============================================== */

interface StatusCardProps {
  title: string;
  message: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function StatusCard({
  title,
  message,
  variant,
  icon: Icon,
  action,
}: StatusCardProps) {
  const variants = {
    success: {
      bg: 'bg-success-100',
      border: 'border-green-200',
      text: 'text-success-700',
      iconBg: 'bg-green-200',
    },
    warning: {
      bg: 'bg-warning-100',
      border: 'border-amber-200',
      text: 'text-warning-700',
      iconBg: 'bg-amber-200',
    },
    danger: {
      bg: 'bg-danger-100',
      border: 'border-red-200',
      text: 'text-danger-700',
      iconBg: 'bg-red-200',
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      text: 'text-primary-700',
      iconBg: 'bg-primary-100',
    },
  };

  const style = variants[variant];

  return (
    <div className={`${style.bg} ${style.text} border ${style.border} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`${style.iconBg} p-2 rounded-lg flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-body-sm mb-1">{title}</h4>
          <p className="text-body-sm opacity-90">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-body-sm font-medium underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==============================================
   WEATHER CARD - Special gradient card
   ============================================== */

interface WeatherCardProps {
  temperature: number;
  condition: string;
  humidity: number;
  rainfall: number;
  icon?: string;
}

export function WeatherCard({
  temperature,
  condition,
  humidity,
  rainfall,
  icon = '☀️',
}: WeatherCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-xl p-5 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-body-sm opacity-90 mb-1">Today's Weather</p>
          <p className="text-heading-xl">{temperature}°C</p>
          <p className="text-body-sm opacity-90 mt-1">{condition}</p>
        </div>
        <div className="text-5xl">{icon}</div>
      </div>
      <div className="flex gap-6 pt-3 border-t border-white/20">
        <div>
          <p className="text-caption opacity-75">Humidity</p>
          <p className="font-semibold">{humidity}%</p>
        </div>
        <div>
          <p className="text-caption opacity-75">Rainfall</p>
          <p className="font-semibold">{rainfall}mm</p>
        </div>
      </div>
    </div>
  );
}

/* ==============================================
   QUICK ACTION BUTTON - For icon grids
   ============================================== */

interface QuickActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}

export function QuickAction({ icon, label, onClick, badge }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="card-interactive flex flex-col items-center justify-center p-4 relative"
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-2">
        {icon}
      </div>
      <span className="text-caption font-medium text-secondary text-center line-clamp-2">{label}</span>
    </button>
  );
}
