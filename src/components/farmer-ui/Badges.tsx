import React from 'react';
import { CheckCircle2, Circle, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * ConfidenceBadge - Visual indicator for AI confidence levels
 * 
 * Design principles:
 * - Clear color coding (green/yellow/red)
 * - Icon + text for accessibility
 * - Large enough to read easily
 */

interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ConfidenceBadge({
  level,
  showLabel = true,
  size = 'md',
}: ConfidenceBadgeProps) {
  const config = {
    high: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: CheckCircle2,
      label: 'High Confidence',
      labelShort: 'High',
    },
    medium: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Circle,
      label: 'Medium Confidence',
      labelShort: 'Medium',
    },
    low: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: AlertTriangle,
      label: 'Low Confidence',
      labelShort: 'Low',
    },
  };

  const sizeStyles = {
    sm: {
      padding: 'px-2.5 py-1',
      text: 'text-xs',
      icon: 'w-3.5 h-3.5',
    },
    md: {
      padding: 'px-3 py-1.5',
      text: 'text-sm',
      icon: 'w-4 h-4',
    },
    lg: {
      padding: 'px-4 py-2',
      text: 'text-base',
      icon: 'w-5 h-5',
    },
  };

  const { bg, text, border, icon: Icon, label, labelShort } = config[level];
  const { padding, text: textSize, icon: iconSize } = sizeStyles[size];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${padding} ${bg} ${text} ${textSize}
        border ${border} rounded-full font-semibold
      `}
    >
      <Icon className={iconSize} />
      {showLabel && (
        <span className="hidden sm:inline">{label}</span>
      )}
      {showLabel && (
        <span className="sm:hidden">{labelShort}</span>
      )}
    </span>
  );
}

/**
 * SeasonBadge - Display crop season information
 */
interface SeasonBadgeProps {
  season: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SeasonBadge({ season, size = 'md' }: SeasonBadgeProps) {
  const seasonConfig: Record<string, { bg: string; text: string; emoji: string }> = {
    kharif: { bg: 'bg-green-100', text: 'text-green-700', emoji: '🌧️' },
    rabi: { bg: 'bg-blue-100', text: 'text-blue-700', emoji: '❄️' },
    zaid: { bg: 'bg-amber-100', text: 'text-amber-700', emoji: '☀️' },
    summer: { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '☀️' },
    winter: { bg: 'bg-cyan-100', text: 'text-cyan-700', emoji: '❄️' },
    monsoon: { bg: 'bg-indigo-100', text: 'text-indigo-700', emoji: '🌧️' },
  };

  const normalizedSeason = season.toLowerCase();
  const config = seasonConfig[normalizedSeason] || { 
    bg: 'bg-gray-100', 
    text: 'text-gray-700', 
    emoji: '🌾' 
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizeStyles[size]} ${config.bg} ${config.text}
        rounded-full font-semibold
      `}
    >
      <span>{config.emoji}</span>
      <span className="capitalize">{season}</span>
    </span>
  );
}

/**
 * TrendIndicator - Show yield/cost comparisons
 */
interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'neutral';
  value?: string;
  label?: string;
}

export function TrendIndicator({ trend, value, label }: TrendIndicatorProps) {
  const config = {
    up: {
      icon: TrendingUp,
      text: 'text-green-600',
      bg: 'bg-green-50',
    },
    down: {
      icon: TrendingDown,
      text: 'text-red-600',
      bg: 'bg-red-50',
    },
    neutral: {
      icon: Minus,
      text: 'text-gray-600',
      bg: 'bg-gray-50',
    },
  };

  const { icon: Icon, text, bg } = config[trend];

  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2 py-1 ${bg} ${text}
        rounded-lg text-sm font-medium
      `}
    >
      <Icon className="w-4 h-4" />
      {value && <span>{value}</span>}
      {label && <span className="text-xs opacity-75">{label}</span>}
    </span>
  );
}

/**
 * MatchIndicator - Show soil/weather match status
 */
interface MatchIndicatorProps {
  matches: {
    label: string;
    matched: boolean;
    icon?: React.ReactNode;
  }[];
}

export function MatchIndicator({ matches }: MatchIndicatorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {matches.map((match, index) => (
        <span
          key={index}
          className={`
            inline-flex items-center gap-1.5
            px-3 py-1.5 rounded-full text-sm font-medium
            ${match.matched
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
            }
          `}
        >
          {match.icon || (
            match.matched ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )
          )}
          {match.label}
        </span>
      ))}
    </div>
  );
}
