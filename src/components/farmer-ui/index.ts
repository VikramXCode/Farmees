/**
 * Farmer UI Component Library
 * 
 * A collection of accessible, farmer-friendly UI components
 * designed for rural users with low digital literacy.
 * 
 * Design Principles:
 * - Large touch targets (min 44-56px)
 * - High contrast colors
 * - Simple, readable text
 * - Clear visual feedback
 * - Government-style trust and clarity
 */

// Buttons
export { default as FarmerButton } from './FarmerButton';

// Cards
export { 
  default as FarmerCard,
  FarmerCardHeader,
  FarmerCardMetric,
} from './FarmerCard';

// Progress Indicators
export { 
  default as StepProgress,
  StepProgressBar,
} from './StepProgress';

// Badges
export {
  default as ConfidenceBadge,
  SeasonBadge,
  TrendIndicator,
  MatchIndicator,
} from './Badges';

// Form Inputs
export {
  default as FarmerInput,
  FarmerSelect,
  FarmerSlider,
  FarmerSegmentedControl,
} from './FarmerInputs';
