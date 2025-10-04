import admin from 'firebase-admin';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'invoice-management-d6ea7'
  });
}

const db = admin.firestore();

// Define the same role structure as in the app
const ROLES = {
  MASTER_ADMIN: 'MasterAdmin',
  FULL_ADMIN: 'FullAdmin', 
  ADMIN: 'Admin',
  FRONT_DESK: 'FrontDesk'
};

const PERMISSIONS = {
  // Dashboard permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Invoice permissions
  CREATE_INVOICE: 'create_invoice',
  VIEW_INVOICES: 'view_invoices',
  EDIT_INVOICES: 'edit_invoices',
  DELETE_INVOICES: 'delete_invoices',
  EXPORT_INVOICES: 'export_invoices',
  
  // Customer permissions
  VIEW_CUSTOMERS: 'view_customers',
  CREATE_CUSTOMERS: 'create_customers',
  EDIT_CUSTOMERS: 'edit_customers',
  DELETE_CUSTOMERS: 'delete_customers',
  
  // Room permissions
  VIEW_ROOMS: 'view_rooms',
  CREATE_ROOMS: 'create_rooms',
  EDIT_ROOMS: 'edit_rooms',
  DELETE_ROOMS: 'delete_rooms',
  UPLOAD_ROOMS: 'upload_rooms',
  MANAGE_ROOM_INVENTORY: 'manage_room_inventory',
  
  // User management permissions
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_ROLES: 'manage_roles',
  
  // Reports permissions
  VIEW_REPORTS: 'view_reports',
  CREATE_REPORTS: 'create_reports',
  EXPORT_REPORTS: 'export_reports',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  
  // System permissions
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_LOGS: 'view_logs',
  BACKUP_DATA: 'backup_data',
  RESTORE_DATA: 'restore_data',
  
  // Advanced permissions
  MANAGE_BILLING: 'manage_billing',
  CONFIGURE_TAXES: 'configure_taxes',
  MANAGE_DISCOUNTS: 'manage_discounts',
  ACCESS_API: 'access_api',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_SECURITY: 'manage_security',
  RESET_PASSWORDS: 'reset_passwords'
};

const ROLE_PERMISSIONS = {
  [ROLES.MASTER_ADMIN]: [
    // Full access to everything
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.EDIT_INVOICES,
    PERMISSIONS.DELETE_INVOICES,
    PERMISSIONS.EXPORT_INVOICES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMERS,
    PERMISSIONS.DELETE_CUSTOMERS,
    PERMISSIONS.VIEW_ROOMS,
    PERMISSIONS.CREATE_ROOMS,
    PERMISSIONS.EDIT_ROOMS,
    PERMISSIONS.DELETE_ROOMS,
    PERMISSIONS.UPLOAD_ROOMS,
    PERMISSIONS.MANAGE_ROOM_INVENTORY,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.BACKUP_DATA,
    PERMISSIONS.RESTORE_DATA,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.CONFIGURE_TAXES,
    PERMISSIONS.MANAGE_DISCOUNTS,
    PERMISSIONS.ACCESS_API,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_SECURITY,
    PERMISSIONS.RESET_PASSWORDS
  ],
  
  [ROLES.FULL_ADMIN]: [
    // Full access except user management and security
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.EDIT_INVOICES,
    PERMISSIONS.DELETE_INVOICES,
    PERMISSIONS.EXPORT_INVOICES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMERS,
    PERMISSIONS.DELETE_CUSTOMERS,
    PERMISSIONS.VIEW_ROOMS,
    PERMISSIONS.CREATE_ROOMS,
    PERMISSIONS.EDIT_ROOMS,
    PERMISSIONS.DELETE_ROOMS,
    PERMISSIONS.UPLOAD_ROOMS,
    PERMISSIONS.MANAGE_ROOM_INVENTORY,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.CONFIGURE_TAXES,
    PERMISSIONS.MANAGE_DISCOUNTS,
    PERMISSIONS.ACCESS_API
  ],
  
  [ROLES.ADMIN]: [
    // Admin role (formerly EditAdmin) - can create and edit but not delete
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.EDIT_INVOICES,
    PERMISSIONS.EXPORT_INVOICES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMERS,
    PERMISSIONS.VIEW_ROOMS,
    PERMISSIONS.CREATE_ROOMS,
    PERMISSIONS.EDIT_ROOMS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS
  ],
  
  [ROLES.FRONT_DESK]: [
    // Front desk staff - view only access (no create invoice, no edit rooms, no invoice history)
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_ROOMS,
    PERMISSIONS.VIEW_REPORTS
  ]
};

async function updateUserPermissions() {
  try {
    console.log('🔄 Starting user permissions update...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`📊 Found ${usersSnapshot.size} users to update`);
    
    const updates = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const userId = doc.id;
      
      console.log(`👤 Processing user: ${userData.email} (${userData.role})`);
      
      // Get role permissions
      const rolePermissions = ROLE_PERMISSIONS[userData.role] || [];
      
      if (rolePermissions.length === 0) {
        console.log(`⚠️  No permissions found for role: ${userData.role}`);
        return;
      }
      
      // Prepare update
      const updateData = {
        permissions: rolePermissions,
        updatedAt: new Date().toISOString(),
        isActive: userData.isActive !== false ? true : userData.isActive // Ensure active unless explicitly set to false
      };
      
      updates.push(
        db.collection('users').doc(userId).update(updateData)
      );
      
      console.log(`✅ Queued update for ${userData.email}: ${rolePermissions.length} permissions`);
      console.log(`   - canViewCustomers: ${rolePermissions.includes(PERMISSIONS.VIEW_CUSTOMERS)}`);
      console.log(`   - canViewInvoices: ${rolePermissions.includes(PERMISSIONS.VIEW_INVOICES)}`);
      console.log(`   - canCreateInvoices: ${rolePermissions.includes(PERMISSIONS.CREATE_INVOICE)}`);
      console.log(`   - canEditRooms: ${rolePermissions.includes(PERMISSIONS.EDIT_ROOMS)}`);
    });
    
    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`🎉 Successfully updated permissions for ${updates.length} users`);
    }
    
  } catch (error) {
    console.error('❌ Error updating user permissions:', error);
    throw error;
  }
}

// Run the update
updateUserPermissions()
  .then(() => {
    console.log('✅ Permission update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Permission update failed:', error);
    process.exit(1);
  });