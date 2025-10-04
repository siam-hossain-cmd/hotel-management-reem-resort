// Debug FullAdmin Permissions - Browser Console Script
// Run this in browser console to debug permission issues

(async function debugFullAdminPermissions() {
  console.log('🔍 Debugging FullAdmin permissions...');
  
  try {
    // Try to access the AuthContext from React
    const authContextInfo = {
      userFromStorage: localStorage.getItem('user'),
      authTokens: Object.keys(localStorage).filter(key => key.includes('firebase')),
    };
    
    console.log('📱 Storage Info:', authContextInfo);
    
    if (authContextInfo.userFromStorage) {
      const userData = JSON.parse(authContextInfo.userFromStorage);
      console.log('👤 User from localStorage:', userData);
    }
    
    // Try to access Firebase and check permissions directly
    const { collection, getDocs, query, where } = window.firebase || {};
    const { db } = window.firebaseServices || window || {};
    
    if (db && collection) {
      console.log('🔍 Checking Firestore permissions...');
      
      const usersQuery = query(collection(db, 'users'), where('email', '==', 'siam2@gmail.com'));
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        
        console.log('📋 Firestore User Data:');
        console.log('   Email:', userData.email);
        console.log('   Role:', userData.role);
        console.log('   isActive:', userData.isActive);
        console.log('   Permissions count:', userData.permissions?.length || 0);
        
        if (userData.permissions) {
          console.log('\n🔑 User Permissions:');
          userData.permissions.forEach((perm, index) => {
            console.log(`   ${index + 1}. ${perm}`);
          });
          
          console.log('\n✅ Key Permission Check:');
          console.log('   view_invoices:', userData.permissions.includes('view_invoices') ? '✅' : '❌');
          console.log('   view_customers:', userData.permissions.includes('view_customers') ? '✅' : '❌');
          console.log('   create_invoice:', userData.permissions.includes('create_invoice') ? '✅' : '❌');
          console.log('   edit_invoices:', userData.permissions.includes('edit_invoices') ? '✅' : '❌');
          console.log('   edit_customers:', userData.permissions.includes('edit_customers') ? '✅' : '❌');
        } else {
          console.log('❌ No permissions array found in Firestore!');
        }
      } else {
        console.log('❌ User not found in Firestore');
      }
    } else {
      console.log('⚠️ Cannot access Firebase from console');
    }
    
    // Try to access React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('🔧 React DevTools detected');
    }
    
    // Check if user can manually test permissions
    console.log('\n🧪 Manual Test Instructions:');
    console.log('1. Login as siam2@gmail.com');
    console.log('2. Try navigating to:');
    console.log('   - http://localhost:5178/invoices');
    console.log('   - http://localhost:5178/customers');
    console.log('3. Check browser console for any errors');
    console.log('4. Check if sidebar shows Invoice and Customer links');
    
    return {
      success: true,
      message: 'Debug info logged above'
    };
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return {
      success: false,
      error: error.message
    };
  }
})();