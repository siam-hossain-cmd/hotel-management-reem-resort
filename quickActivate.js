// Quick User Activation Script - Run in Browser Console
// Navigate to http://localhost:5178 and paste this in console

(async function quickActivateUser() {
  console.log('🔧 Activating user account...');
  
  const { collection, getDocs, doc, updateDoc, query, where } = window.firebase;
  const { db } = window.firebaseServices || window;
  
  if (!db) {
    console.error('❌ Firebase not available. Make sure you\'re on the app page.');
    return;
  }

  try {
    // Find the user siam2@gmail.com
    const usersQuery = query(collection(db, 'users'), where('email', '==', 'siam2@gmail.com'));
    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) {
      console.error('❌ User not found');
      return;
    }

    const userDoc = snapshot.docs[0];
    console.log('👤 Found user:', userDoc.data().email);
    
    // Update to activate
    await updateDoc(doc(db, 'users', userDoc.id), {
      isActive: true,
      lastUpdated: new Date().toISOString()
    });
    
    console.log('✅ SUCCESS! User activated - refresh page and try logging in');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();