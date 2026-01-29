/**
 * Utility to clear browser cache and storage
 * Call this function to clear all cached data
 */

export const clearAllCache = () => {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear IndexedDB (if used)
    if (window.indexedDB) {
      window.indexedDB.databases().then((dbs) => {
        dbs.forEach((db) => {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
    
    // Clear cache storage (Service Workers)
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    
    console.log('✅ All cache cleared successfully');
    
    // Force reload to get fresh data
    window.location.reload();
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Clear only authentication related cache
 */
export const clearAuthCache = () => {
  try {
    localStorage.removeItem('farmease_user');
    localStorage.removeItem('farmease_token');
    sessionStorage.clear();
    console.log('✅ Auth cache cleared');
  } catch (error) {
    console.error('Error clearing auth cache:', error);
  }
};

/**
 * Clear app data cache (weather, market, etc.)
 */
export const clearAppDataCache = () => {
  try {
    const keysToKeep = ['farmease_user', 'farmease_token', 'farmease_language'];
    
    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ App data cache cleared');
    window.location.reload();
  } catch (error) {
    console.error('Error clearing app data cache:', error);
  }
};
