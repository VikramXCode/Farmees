import React from 'react';
import { useConnectivity } from '../contexts/ConnectivityContext';

interface ConnectivityIndicatorProps {
  className?: string;
  showText?: boolean;
}

export default function ConnectivityIndicator({ 
  className = '', 
  showText = true 
}: ConnectivityIndicatorProps) {
  const { online, isAutoDetected, toggle, enableAutoDetect } = useConnectivity();

  const getStatusColor = () => {
    if (online) return 'text-green-600 bg-green-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = () => {
    if (online) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  const getStatusText = () => {
    if (online) {
      return 'Online';
    }
    return 'Offline';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status Indicator */}
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {getStatusIcon()}
        {showText && (
          <span className="hidden sm:inline">
            {getStatusText()}
          </span>
        )}
      </div>
    </div>
  );
}

// Compact version for mobile/small screens
export function CompactConnectivityIndicator({ className = '' }: { className?: string }) {
  const { online } = useConnectivity();

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-xs text-gray-600">
        {online ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
