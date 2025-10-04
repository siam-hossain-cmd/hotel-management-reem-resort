/**
 * Activity Tracking Service
 * 
 * Comprehensive activity logging and history management system
 * for security monitoring and audit trails.
 */

import { 
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// =============================================================================
// ACTIVITY TRACKING CONSTANTS
// =============================================================================

export const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_RESET: 'password_reset',
  
  // User Management
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  ROLE_CHANGED: 'role_changed',
  PERMISSIONS_CHANGED: 'permissions_changed',
  
  // Invoice Management
  INVOICE_CREATED: 'invoice_created',
  INVOICE_UPDATED: 'invoice_updated',
  INVOICE_DELETED: 'invoice_deleted',
  INVOICE_SENT: 'invoice_sent',
  INVOICE_PAID: 'invoice_paid',
  INVOICE_EXPORTED: 'invoice_exported',
  
  // Room Management
  ROOM_CREATED: 'room_created',
  ROOM_UPDATED: 'room_updated',
  ROOM_DELETED: 'room_deleted',
  ROOM_RESERVED: 'room_reserved',
  ROOM_CHECKOUT: 'room_checkout',
  
  // Customer Management
  CUSTOMER_CREATED: 'customer_created',
  CUSTOMER_UPDATED: 'customer_updated',
  CUSTOMER_DELETED: 'customer_deleted',
  
  // System Management
  SYSTEM_SETTINGS_UPDATED: 'system_settings_updated',
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',
  BACKUP_CREATED: 'backup_created',
  
  // Security Events
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  PERMISSION_DENIED: 'permission_denied',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  SESSION_EXPIRED: 'session_expired'
};

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const TARGET_TYPES = {
  USER: 'user',
  INVOICE: 'invoice',
  ROOM: 'room',
  CUSTOMER: 'customer',
  SYSTEM: 'system',
  SESSION: 'session'
};

// =============================================================================
// ACTIVITY TRACKING SERVICE
// =============================================================================

class ActivityTrackingService {
  constructor() {
    this.isEnabled = true;
    this.batchSize = 50;
    this.retentionDays = 365; // Keep history for 1 year
  }

  // ---------------------------------------------------------------------------
  // CORE LOGGING METHODS
  // ---------------------------------------------------------------------------

  /**
   * Log a user activity
   * @param {string} userId - ID of user performing the action
   * @param {string} activityType - Type of activity from ACTIVITY_TYPES
   * @param {Object} details - Additional details about the activity
   */
  async logActivity(userId, activityType, details = {}) {
    if (!this.isEnabled) return;

    try {
      const activityData = {
        // Core identification
        actionId: this.generateActionId(),
        action: activityType,
        description: this.generateDescription(activityType, details),
        
        // User information
        userId: userId || 'anonymous',
        userEmail: details.userEmail || await this.getUserEmail(userId),
        userRole: details.userRole || await this.getUserRole(userId),
        
        // Target information
        targetType: details.targetType || TARGET_TYPES.SYSTEM,
        targetId: details.targetId || null,
        targetName: details.targetName || null,
        
        // Change tracking
        changes: this.sanitizeChanges(details.changes || null),
        
        // Metadata
        timestamp: serverTimestamp(),
        ipAddress: details.ipAddress || await this.getClientIP(),
        userAgent: details.userAgent || navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        
        // Status and context
        success: details.success !== false,
        errorMessage: details.errorMessage || null,
        riskLevel: details.riskLevel || this.assessRiskLevel(activityType, details),
        
        // Additional context
        metadata: details.metadata || {},
        sessionId: details.sessionId || null,
        correlationId: details.correlationId || null
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'history'), activityData);
      
      // Handle high-risk activities
      if (activityData.riskLevel === RISK_LEVELS.HIGH || 
          activityData.riskLevel === RISK_LEVELS.CRITICAL) {
        await this.handleHighRiskActivity(activityData);
      }

      console.log(`📝 Activity logged: ${activityType} (${activityData.riskLevel})`);
      return docRef.id;

    } catch (error) {
      console.error('❌ Error logging activity:', error);
      // Don't throw - logging failures shouldn't break the main functionality
      return null;
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(userId, type, details = {}) {
    return this.logActivity(userId, type, {
      ...details,
      targetType: TARGET_TYPES.SESSION,
      riskLevel: this.getAuthRiskLevel(type, details)
    });
  }

  /**
   * Log user management events
   */
  async logUserManagement(adminUserId, targetUserId, type, details = {}) {
    const targetUser = await this.getUserProfile(targetUserId);
    
    return this.logActivity(adminUserId, type, {
      ...details,
      targetType: TARGET_TYPES.USER,
      targetId: targetUserId,
      targetName: targetUser?.name || targetUser?.email || 'Unknown User',
      riskLevel: RISK_LEVELS.MEDIUM
    });
  }

  /**
   * Log business operations
   */
  async logBusinessOperation(userId, type, targetType, targetData, details = {}) {
    return this.logActivity(userId, type, {
      ...details,
      targetType: targetType,
      targetId: targetData.id,
      targetName: targetData.name || targetData.title || targetData.id,
      riskLevel: RISK_LEVELS.LOW
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(userId, type, details = {}) {
    return this.logActivity(userId, type, {
      ...details,
      targetType: TARGET_TYPES.SYSTEM,
      riskLevel: RISK_LEVELS.HIGH
    });
  }

  // ---------------------------------------------------------------------------
  // HISTORY RETRIEVAL METHODS
  // ---------------------------------------------------------------------------

  /**
   * Get user activity history
   */
  async getUserHistory(userId, options = {}) {
    try {
      const {
        limit: limitCount = 50,
        activityTypes = null,
        startDate = null,
        endDate = null,
        riskLevel = null
      } = options;

      let q = query(
        collection(db, 'history'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      // Add filters
      if (activityTypes && activityTypes.length > 0) {
        q = query(q, where('action', 'in', activityTypes));
      }

      if (riskLevel) {
        q = query(q, where('riskLevel', '==', riskLevel));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() // Convert Firestore timestamp
      }));

    } catch (error) {
      console.error('Error getting user history:', error);
      return [];
    }
  }

  /**
   * Get system-wide activity history (admin only)
   */
  async getSystemHistory(options = {}) {
    try {
      const {
        limit: limitCount = 100,
        activityTypes = null,
        riskLevel = null,
        userId = null
      } = options;

      let q = query(
        collection(db, 'history'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      // Add filters
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      if (activityTypes && activityTypes.length > 0) {
        q = query(q, where('action', 'in', activityTypes));
      }

      if (riskLevel) {
        q = query(q, where('riskLevel', '==', riskLevel));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

    } catch (error) {
      console.error('Error getting system history:', error);
      return [];
    }
  }

  /**
   * Get recent security events
   */
  async getSecurityEvents(limitCount = 20) {
    try {
      const q = query(
        collection(db, 'history'),
        where('riskLevel', 'in', [RISK_LEVELS.HIGH, RISK_LEVELS.CRITICAL]),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

    } catch (error) {
      console.error('Error getting security events:', error);
      return [];
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(timeRange = 'week') {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const q = query(
        collection(db, 'history'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate))
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map(doc => doc.data());

      // Calculate statistics
      const stats = {
        totalActivities: activities.length,
        uniqueUsers: new Set(activities.map(a => a.userId)).size,
        activityBreakdown: {},
        riskBreakdown: {},
        dailyBreakdown: {}
      };

      // Count by activity type
      activities.forEach(activity => {
        stats.activityBreakdown[activity.action] = 
          (stats.activityBreakdown[activity.action] || 0) + 1;
        
        stats.riskBreakdown[activity.riskLevel] = 
          (stats.riskBreakdown[activity.riskLevel] || 0) + 1;
        
        const day = activity.timestamp?.toDate().toDateString() || 'Unknown';
        stats.dailyBreakdown[day] = 
          (stats.dailyBreakdown[day] || 0) + 1;
      });

      return stats;

    } catch (error) {
      console.error('Error getting activity stats:', error);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // UTILITY METHODS
  // ---------------------------------------------------------------------------

  generateDescription(activityType, details) {
    const templates = {
      [ACTIVITY_TYPES.LOGIN]: 'User logged in successfully',
      [ACTIVITY_TYPES.LOGOUT]: 'User logged out',
      [ACTIVITY_TYPES.LOGIN_FAILED]: `Login failed: ${details.reason || 'Invalid credentials'}`,
      [ACTIVITY_TYPES.USER_CREATED]: `Created new user: ${details.targetName}`,
      [ACTIVITY_TYPES.USER_UPDATED]: `Updated user: ${details.targetName}`,
      [ACTIVITY_TYPES.USER_DELETED]: `Deleted user: ${details.targetName}`,
      [ACTIVITY_TYPES.ROLE_CHANGED]: `Changed role for ${details.targetName} from ${details.oldRole} to ${details.newRole}`,
      [ACTIVITY_TYPES.INVOICE_CREATED]: `Created invoice: ${details.targetName}`,
      [ACTIVITY_TYPES.INVOICE_UPDATED]: `Updated invoice: ${details.targetName}`,
      [ACTIVITY_TYPES.INVOICE_DELETED]: `Deleted invoice: ${details.targetName}`,
      [ACTIVITY_TYPES.UNAUTHORIZED_ACCESS]: `Unauthorized access attempt: ${details.reason}`,
      [ACTIVITY_TYPES.PERMISSION_DENIED]: `Permission denied: ${details.permission}`
    };

    return templates[activityType] || `Performed action: ${activityType}`;
  }

  assessRiskLevel(activityType, details) {
    // Critical risk activities
    const criticalActivities = [
      ACTIVITY_TYPES.USER_DELETED,
      ACTIVITY_TYPES.SYSTEM_SETTINGS_UPDATED,
      ACTIVITY_TYPES.UNAUTHORIZED_ACCESS
    ];

    // High risk activities
    const highRiskActivities = [
      ACTIVITY_TYPES.ROLE_CHANGED,
      ACTIVITY_TYPES.PERMISSIONS_CHANGED,
      ACTIVITY_TYPES.DATA_EXPORTED,
      ACTIVITY_TYPES.SUSPICIOUS_ACTIVITY,
      ACTIVITY_TYPES.PERMISSION_DENIED
    ];

    // Medium risk activities
    const mediumRiskActivities = [
      ACTIVITY_TYPES.USER_CREATED,
      ACTIVITY_TYPES.USER_UPDATED,
      ACTIVITY_TYPES.LOGIN_FAILED,
      ACTIVITY_TYPES.PASSWORD_RESET
    ];

    if (criticalActivities.includes(activityType)) {
      return RISK_LEVELS.CRITICAL;
    } else if (highRiskActivities.includes(activityType)) {
      return RISK_LEVELS.HIGH;
    } else if (mediumRiskActivities.includes(activityType)) {
      return RISK_LEVELS.MEDIUM;
    }

    return RISK_LEVELS.LOW;
  }

  getAuthRiskLevel(type, details) {
    if (type === ACTIVITY_TYPES.LOGIN_FAILED) {
      if (details.attempts && details.attempts > 3) {
        return RISK_LEVELS.HIGH;
      }
      return RISK_LEVELS.MEDIUM;
    }
    return RISK_LEVELS.LOW;
  }

  sanitizeChanges(changes) {
    if (!changes) return null;

    // Remove sensitive fields from change tracking
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    const sanitized = { ...changes };

    if (sanitized.before) {
      sensitiveFields.forEach(field => {
        if (sanitized.before[field]) {
          sanitized.before[field] = '[REDACTED]';
        }
      });
    }

    if (sanitized.after) {
      sensitiveFields.forEach(field => {
        if (sanitized.after[field]) {
          sanitized.after[field] = '[REDACTED]';
        }
      });
    }

    return sanitized;
  }

  async handleHighRiskActivity(activityData) {
    // In a real implementation, this could:
    // - Send alerts to administrators
    // - Trigger security reviews
    // - Temporarily disable accounts
    // - Log to external security systems
    
    console.warn('🚨 High-risk activity detected:', {
      action: activityData.action,
      userId: activityData.userId,
      riskLevel: activityData.riskLevel,
      timestamp: new Date()
    });

    // For now, just log to console
    if (activityData.riskLevel === RISK_LEVELS.CRITICAL) {
      console.error('🔴 CRITICAL SECURITY EVENT:', activityData);
    }
  }

  async getUserProfile(userId) {
    try {
      if (!userId || userId === 'anonymous') return null;
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      return null;
    }
  }

  async getUserEmail(userId) {
    const profile = await this.getUserProfile(userId);
    return profile?.email || 'unknown';
  }

  async getUserRole(userId) {
    const profile = await this.getUserProfile(userId);
    return profile?.role || 'unknown';
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  async getClientIP() {
    // In a real implementation, you'd get this from your server
    // For now, return a placeholder
    return 'client-ip-unknown';
  }

  generateActionId() {
    return 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION METHODS
  // ---------------------------------------------------------------------------

  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`📝 Activity tracking ${enabled ? 'enabled' : 'disabled'}`);
  }

  setBatchSize(size) {
    this.batchSize = Math.max(1, Math.min(size, 1000)); // Between 1 and 1000
  }

  setRetentionDays(days) {
    this.retentionDays = Math.max(1, days);
  }
}

// Export singleton instance
const activityTracker = new ActivityTrackingService();
export default activityTracker;