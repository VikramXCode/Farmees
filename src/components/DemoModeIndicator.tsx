// Optional: Demo Mode Visual Indicator Component
// Add this to your frontend to show when demo mode is active

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function DemoModeIndicator() {
  const { user } = useAuth();

  if (!user?.isDemo) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: '#ff9800',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span style={{ fontSize: '18px' }}>🎭</span>
      <span>DEMO MODE</span>
    </div>
  );
}

// Usage: Add to your Layout.tsx or App.tsx
// import { DemoModeIndicator } from './components/DemoModeIndicator';
// 
// function Layout() {
//   return (
//     <div>
//       <DemoModeIndicator />
//       {/* rest of your app */}
//     </div>
//   );
// }
