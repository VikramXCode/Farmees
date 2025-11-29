import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ConnectivityContextType = {
  online: boolean;
  setOnline: (v: boolean) => void;
  toggle: () => void;
  isAutoDetected: boolean;
  enableAutoDetect: () => void;
};

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState<boolean>(() => {
    // Check if we have a saved preference, otherwise use navigator.onLine
    const saved = localStorage.getItem('farmease_online');
    if (saved !== null) {
      return saved === 'true';
    }
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(() => {
    return localStorage.getItem('farmease_auto_detect') !== 'false';
  });

  // Auto-detect connectivity changes
  useEffect(() => {
    if (!isAutoDetected) return;

    const handleOnline = () => {
      setOnline(true);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    // Test actual connectivity by pinging a reliable endpoint
    const testConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        setOnline(true);
      } catch (error) {
        setOnline(false);
      }
    };

    // Initial connectivity test
    testConnectivity();

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check (every 30 seconds)
    const interval = setInterval(testConnectivity, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isAutoDetected]);

  // Save online status to localStorage
  useEffect(() => {
    localStorage.setItem('farmease_online', String(online));
  }, [online]);

  // Save auto-detect preference
  useEffect(() => {
    localStorage.setItem('farmease_auto_detect', String(isAutoDetected));
  }, [isAutoDetected]);

  const toggle = () => {
    setIsAutoDetected(false); // Disable auto-detection when manually toggled
    setOnline(v => !v);
  };

  const enableAutoDetect = () => {
    setIsAutoDetected(true);
    // Test connectivity immediately when enabling auto-detect
    if (typeof navigator !== 'undefined') {
      setOnline(navigator.onLine);
    }
  };

  return (
    <ConnectivityContext.Provider value={{ 
      online, 
      setOnline, 
      toggle, 
      isAutoDetected,
      enableAutoDetect 
    }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) throw new Error('useConnectivity must be used within ConnectivityProvider');
  return ctx;
}
