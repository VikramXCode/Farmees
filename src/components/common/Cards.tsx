
import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  onClick?: () => void;
  className?: string;
}

export function InfoCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-farm-primary-100',
  iconColor = 'text-farm-primary-600',
  onClick,
  className = '',
}: InfoCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`card-farm ${onClick ? 'cursor-pointer hover:shadow-card-hover active:scale-[0.98]' : ''} transition-all ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-muted mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary mb-1">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`${iconBgColor} ${iconColor} p-3 rounded-xl`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Component>
  );
}

interface ActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  variant = 'secondary',
  className = '',
}: ActionCardProps) {
  const variants = {
    primary: 'bg-farm-primary-600 text-white border-farm-primary-600',
    secondary: 'bg-farm-primary-50 text-farm-primary-700 border-farm-primary-200',
    outline: 'bg-white text-text-primary border-gray-300',
  };

  return (
    <button
      onClick={onClick}
      className={`${variants[variant]} border rounded-xl p-4 hover:shadow-card-hover active:scale-[0.98] transition-all text-left w-full ${className}`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-6 h-6 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{title}</p>
          {description && <p className="text-xs opacity-80 mt-0.5 line-clamp-1">{description}</p>}
        </div>
      </div>
    </button>
  );
}

interface StatusCardProps {
  title: string;
  status: 'success' | 'warning' | 'danger' | 'info';
  message: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function StatusCard({
  title,
  status,
  message,
  icon: Icon,
  action,
  className = '',
}: StatusCardProps) {
  const statusStyles = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-700',
      iconBg: 'bg-success-100',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      text: 'text-warning-700',
      iconBg: 'bg-warning-100',
    },
    danger: {
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      text: 'text-danger-700',
      iconBg: 'bg-danger-100',
    },
    info: {
      bg: 'bg-farm-primary-50',
      border: 'border-farm-primary-200',
      text: 'text-farm-primary-700',
      iconBg: 'bg-farm-primary-100',
    },
  };

  const styles = statusStyles[status];

  return (
    <div className={`${styles.bg} ${styles.border} ${styles.text} border rounded-xl p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {Icon && (
          <div className={`${styles.iconBg} p-2 rounded-lg flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-sm opacity-90">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 text-sm font-medium underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface WeatherCardProps {
  temperature: number;
  condition: string;
  humidity: number;
  rainfall: number;
  icon?: string;
  className?: string;
}

export function WeatherCard({
  temperature,
  condition,
  humidity,
  rainfall,
  icon = '☀️',
  className = '',
}: WeatherCardProps) {
  return (
    <div className={`card-farm-elevated bg-gradient-to-br from-farm-primary-500 to-farm-primary-700 text-white ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm opacity-90 mb-1">Today's Weather</p>
          <p className="text-4xl font-bold">{temperature}°C</p>
          <p className="text-sm opacity-90 mt-1">{condition}</p>
        </div>
        <div className="text-5xl">{icon}</div>
      </div>
      <div className="flex justify-between text-sm opacity-90 pt-3 border-t border-white/20">
        <div>
          <p className="text-xs opacity-75">Humidity</p>
          <p className="font-semibold">{humidity}%</p>
        </div>
        <div>
          <p className="text-xs opacity-75">Rainfall</p>
          <p className="font-semibold">{rainfall}mm</p>
        </div>
      </div>
    </div>
  );
}
