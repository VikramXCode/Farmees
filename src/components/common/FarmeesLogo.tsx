interface FarmeesLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Farmees Logo Component
 * 
 * A leaf with a bee representing:
 * - The green leaf symbolizes agriculture and growth
 * - The bee represents pollination, hard work, and nature
 * - Together they represent sustainable farming
 */
export default function FarmeesLogo({ 
  size = 'md', 
  className = '' 
}: FarmeesLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dcfce7" />
          </linearGradient>
        </defs>
        
        {/* Rounded square background */}
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          rx="22"
          fill="url(#logoGradient)"
        />
        
        {/* Large Leaf */}
        <path
          d="M50 18C50 18 75 28 80 55C85 82 60 88 50 88C40 88 15 82 20 55C25 28 50 18 50 18Z"
          fill="white"
          fillOpacity="0.95"
        />
        {/* Leaf vein */}
        <path
          d="M50 24V78M50 40L38 52M50 50L62 62M50 60L40 70"
          stroke="#22c55e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        
        {/* Bee Body */}
        <ellipse cx="62" cy="38" rx="12" ry="9" fill="#fbbf24" />
        {/* Bee stripes */}
        <path d="M56 34L56 42" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M62 33L62 43" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M68 34L68 42" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Bee head */}
        <circle cx="74" cy="38" r="5" fill="#1f2937" />
        
        {/* Bee wings */}
        <ellipse cx="58" cy="30" rx="6" ry="4" fill="white" fillOpacity="0.8" transform="rotate(-20 58 30)" />
        <ellipse cx="64" cy="29" rx="5" ry="3.5" fill="white" fillOpacity="0.7" transform="rotate(10 64 29)" />
        
        {/* Bee stinger */}
        <path d="M50 40L48 42" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/**
 * Simple icon version for very small spaces
 */
export function FarmeesIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="6" fill="url(#iconGradient)" />
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
      {/* Mini leaf */}
      <path
        d="M12 5C12 5 17 7 18 13C19 19 14 20 12 20C10 20 5 19 6 13C7 7 12 5 12 5Z"
        fill="white"
        fillOpacity="0.9"
      />
      {/* Mini bee */}
      <ellipse cx="15" cy="10" rx="2.5" ry="2" fill="#fbbf24" />
      <circle cx="17" cy="10" r="1" fill="#1f2937" />
    </svg>
  );
}
