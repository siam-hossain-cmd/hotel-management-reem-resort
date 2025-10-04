// Migration script to add permissions to existing users
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA1lgNhs_MSTkMyA2nhRvi3vHf6KeHS-nE",
  authDomain: "invoice-reem-resort.firebaseapp.com",
  projectId: "invoice-reem-resort",
  storageBucket: "invoice-reem-resort.firebasestorage.app",
  messagingSenderId: "483324573465",
  appId: "1:483324573465:web:d668568deffec4ba94f788"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Role permissions (matching the ones from AuthContext)
const ROLE_PERMISSIONS = {
  'MasterAdmin': [
    'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices', 'delete_invoices',
    'export_invoices', 'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
    'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms', 'upload_rooms', 'manage_room_inventory',
    'view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'view_reports',
    'create_reports', 'export_reports', 'view_financial_reports', 'manage_settings', 'view_logs',
    'backup_data', 'restore_data', 'manage_billing', 'configure_taxes', 'manage_discounts',
    'access_api', 'view_audit_logs', 'manage_security', 'reset_passwords'
  ],
  'FullAdmin': [
    'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices', 'delete_invoices',
    'export_invoices', 'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
    'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms', 'upload_rooms', 'manage_room_inventory',
    'view_reports', 'create_reports', 'export_reports', 'view_financial_reports', 'manage_billing',
    'configure_taxes', 'manage_discounts', 'access_api'
  ],
  'EditAdmin': [
    'view_dashboard', 'create_invoice', 'view_invoices', 'edit_invoices', 'export_invoices',
    'view_customers', 'create_customers', 'edit_customers', 'view_rooms', 'create_rooms', 'edit_rooms',
    'view_reports', 'create_reports', 'export_reports'
  ],
  'ViewAdmin': [
    'view_dashboard', 'view_invoices', 'view_customers', 'view_rooms', 'view_reports', 'export_reports'
  ],
  'FrontDesk': [
    'view_dashboard', 'create_invoice', 'view_invoices', 'edit_invoices', 'view_customers',
    'create_customers', 'edit_customers', 'view_rooms'
  ],
  // Handle legacy 'admin' role
  'admin': [
    'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices', 'delete_invoices',
    'export_invoices', 'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
    'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms', 'upload_rooms', 'manage_room_inventory',
    'view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'view_reports',
    'create_reports', 'export_reports', 'view_financial_reports', 'manage_settings', 'view_logs',
    'backup_data', 'restore_data', 'manage_billing', 'configure_taxes', 'manage_discounts',
    'access_api', 'view_audit_logs', 'manage_security', 'reset_passwords'
  ]
};

async function addPermissionsToUsers() {
  console.log('🔄 Starting permissions migration...');
  
  try {
    // Get all users from the collection
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Found ${users.length} users to update`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        // Skip if user already has permissions
        if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
          console.log(`⏭️ Skipping user: ${user.email} (already has permissions)`);
          skipped++;
          continue;
        }
        
        // Get role permissions
        const userRole = user.role || 'ViewAdmin'; // Default to ViewAdmin if no role
        const rolePermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS['ViewAdmin'];
        
        console.log(`🔧 Updating user: ${user.email} (Role: ${userRole}, Permissions: ${rolePermissions.length})`);
        
        // Update user document with permissions
        await updateDoc(doc(db, 'users', user.id), {
          permissions: rolePermissions,
          updatedAt: new Date().toISOString(),
          migrationDate: new Date().toISOString(),
          migrationVersion: '1.0.0'
        });
        
        updated++;
        console.log(`✅ Updated user: ${user.email}`);
        
      } catch (error) {
        console.error(`❌ Error updating user ${user.email}:`, error);
        errors++;
      }
    }
    
    console.log(`✅ Migration complete!`);
    console.log(`📊 Updated: ${updated} users`);
    console.log(`📊 Skipped: ${skipped} users`);
    console.log(`📊 Errors: ${errors} users`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
addPermissionsToUsers().then(() => {
  console.log('🎉 Permissions migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Permissions migration script failed:', error);
  process.exit(1);
});