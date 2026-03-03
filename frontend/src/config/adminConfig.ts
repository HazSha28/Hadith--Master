// Admin configuration for Hadith Master
// Add your Firebase Auth UIDs here to grant admin access

export const ADMIN_CONFIG = {
  // Add your UID here (get it from Firebase Auth after logging in)
  ADMIN_UIDS: [
    "9EQwVF9srSQkLd5LWsLmdaPQePd2",
    "XncNQ5wOQ3VzkEoK0AYuO8j4ngG2"
  ],

  ADMIN_EMAILS: [
    "tohazsha@gmail.com",
    "macsabs@gmail.com"
  ],

  // Auto-approve these email domains (optional)
  APPROVED_DOMAINS: [],

  // Require admin approval for these roles
  ROLES_REQUIRING_APPROVAL: ['scholar', 'admin'],

  // Comment moderation settings
  COMMENT_SETTINGS: {
    AUTO_APPROVE_TRUSTED_USERS: true,
    REQUIRE_APPROVAL_FOR_NEW_USERS: true,
    MAX_COMMENT_LENGTH: 1000
  }
};

// Helper function to check if email is an admin email
export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_CONFIG.ADMIN_EMAILS.includes(email.toLowerCase());
};

// Helper function to get admin status by UID or Email
export const getAdminStatus = (uid: string, email?: string | null): boolean => {
  return ADMIN_CONFIG.ADMIN_UIDS.includes(uid) || isAdminEmail(email);
};
