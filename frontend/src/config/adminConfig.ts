// Admin configuration for Hadith Master
// Add your Firebase Auth UIDs here to grant admin access

export const ADMIN_CONFIG = {
  // Add your UID here (get it from Firebase Auth after logging in)
  ADMIN_UIDS: [
     "9EQwVF9srSQkLd5LWsLmdaPQePd2",
     "XncNQ5wOQ3VzkEoK0AYuO8j4ngG2"
  ],
  
  // Auto-approve these email domains (optional)
  APPROVED_DOMAINS: [
    "tohazsha@gmail.com",
     "macsabs@gmail.com"
  ],
  
  // Require admin approval for these roles
  ROLES_REQUIRING_APPROVAL: ['scholar', 'admin'],
  
  // Comment moderation settings
  COMMENT_SETTINGS: {
    AUTO_APPROVE_TRUSTED_USERS: true,
    REQUIRE_APPROVAL_FOR_NEW_USERS: true,
    MAX_COMMENT_LENGTH: 1000
  }
};

// Helper function to check if email is from approved domain
export const isApprovedDomain = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return ADMIN_CONFIG.APPROVED_DOMAINS.includes(domain);
};

// Helper function to get admin status
export const getAdminStatus = (uid: string): boolean => {
  return ADMIN_CONFIG.ADMIN_UIDS.includes(uid);
};
