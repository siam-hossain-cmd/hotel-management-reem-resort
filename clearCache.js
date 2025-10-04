// Clear User Cache and Force Refresh - Browser Console Script
// This will clear any cached user data and force a fresh login

(function clearUserCacheAndRefresh() {
  console.log('🔄 Clearing user cache and forcing refresh...');
  
  try {
    // Clear localStorage
    console.log('🗑️ Clearing localStorage...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('firebase') || key.includes('user') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      console.log(`   Removing: ${key}`);
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage
    console.log('🗑️ Clearing sessionStorage...');
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('firebase') || key.includes('user') || key.includes('auth'))) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      console.log(`   Removing: ${key}`);
      sessionStorage.removeItem(key);
    });
    
    // Clear cookies if any
    console.log('🍪 Clearing auth cookies...');
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ Cache cleared successfully!');
    console.log('🔄 Refreshing page in 2 seconds...');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
})();