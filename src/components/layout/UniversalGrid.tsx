/**
 * Universal Grid System
 * 
 * Auto-flowing grid that adapts naturally WITHOUT breakpoints:
 * - Uses CSS Grid auto-fit
 * - Cards flow from 1 → 2 → 3 columns naturally
 * - Same structure on all devices
 */

import { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  /** Minimum card width (default: 280px) */
  minWidth?: string;
  /** Gap between cards (default: gap-4) */
  gap?: string;
  className?: string;
}

/**
 * FlowGrid - General purpose auto-flowing grid
 * 
 * Uses CSS Grid auto-fit for natural responsiveness:
 * - Mobile: 1 column (cards fill width)
 * - Tablet: 2 columns (when space allows)
 * - Desktop: 3 columns (when space allows)
 * 
 * No breakpoints needed!
 */
export function FlowGrid({ 
  children, 
  minWidth = '280px', 
  gap = 'gap-4',
  className = '' 
}: GridProps) {
  return (
    <div 
      className={`grid ${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minWidth}, 100%), 1fr))`
      }}
    >
      {children}
    </div>
  );
}

// Alias for backwards compatibility
export const CardGrid = FlowGrid;

/**
 * Two Column Grid
 * 
 * Always 2 columns on larger screens, 1 on small
 * Uses auto-fit with larger min-width
 */
export function TwoColumnGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div 
      className={`grid gap-4 ${className}`}
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))'
      }}
    >
      {children}
    </div>
  );
}

/**
 * ActionGrid - Grid for quick action buttons
 * 
 * 4-5 columns on larger screens, 2-3 on smaller
 * Ideal for icon buttons with labels
 */
export function ActionGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div 
      className={`grid gap-3 ${className}`}
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(80px, 100%), 1fr))'
      }}
    >
      {children}
    </div>
  );
}

// Alias for backwards compatibility
export const QuickActionsGrid = ActionGrid;

/**
 * StatsGrid - For displaying 2-4 stat cards in a row
 */
export function StatsGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div 
      className={`grid gap-3 ${className}`}
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))'
      }}
    >
      {children}
    </div>
  );
}

/**
 * Flex Row - Horizontal flex container that wraps naturally
 */
export function FlexRow({ 
  children, 
  gap = 'gap-3',
  className = '' 
}: { 
  children: ReactNode; 
  gap?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap ${gap} ${className}`}>
      {children}
    </div>
  );
}
