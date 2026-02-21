# Admin Panel Setup Guide

This guide will help you set up the admin panel for the Hadith Master application, where you and another designated admin can manage user approvals and moderate scholar comments.

## Features

### User Management
- **User Approval**: Approve or reject new user registrations
- **User Suspension**: Suspend users who violate community guidelines
- **Role Management**: Assign roles (user, scholar, admin)
- **User Statistics**: View comprehensive user analytics

### Comment Moderation
- **Scholar Comments**: Review and approve scholarly commentaries on hadiths
- **Content Filtering**: Reject inappropriate or inaccurate content
- **Comment Management**: Delete problematic comments
- **Moderation Analytics**: Track approval rates and moderation activity

## Setup Instructions

### Step 1: Get Your Firebase Auth UID

1. Log in to the Hadith Master application
2. Visit `/admin/setup` to get your user ID
3. Copy your UID (it will be automatically copied to clipboard)

### Step 2: Configure Admin Access

1. Open the file: `src/config/adminConfig.ts`
2. Add your UID to the `ADMIN_UIDS` array:

```typescript
export const ADMIN_CONFIG = {
  ADMIN_UIDS: [
    "your-uid-here",        // Replace with your actual UID
    "other-admin-uid-here"   // Add the second admin's UID
  ],
  // ... other config
};
```

### Step 3: Grant Admin Role

1. After adding your UID to the config, visit `/admin/setup`
2. Click "Grant Admin Access" to set your role in the database
3. Refresh the page to apply the changes

### Step 4: Access Admin Panel

1. Navigate to `/admin/panel`
2. You should now have full admin access
3. The admin panel includes:
   - Dashboard with statistics
   - User management interface
   - Comment moderation tools
   - Pending approvals queue

## Admin Panel Routes

- `/admin/panel` - Main admin dashboard
- `/admin/setup` - Setup guide for new admins
- `/admin/chat` - Admin chat dashboard (existing)

## User Approval Workflow

1. **New Registration**: Users sign up with status "pending"
2. **Admin Review**: Admins review pending users in the admin panel
3. **Decision**: Approve, reject, or request more information
4. **Notification**: Users are notified of the decision
5. **Access**: Approved users gain full access to the platform

## Comment Moderation Workflow

1. **Scholar Submission**: Scholars submit commentaries on hadiths
2. **Auto-Pending**: All comments start as "pending" status
3. **Admin Review**: Admins review content for accuracy and appropriateness
4. **Publication**: Approved comments appear on hadith pages
5. **Rejection**: Inappropriate comments are rejected with reason

## Security Considerations

### Admin Access
- Only grant admin access to trusted individuals
- Admin UIDs should be kept secure
- Regularly review admin access lists

### User Data
- All admin actions are logged with timestamps
- Rejection reasons are stored for audit trails
- User approval history is maintained

### Content Moderation
- Implement clear moderation guidelines
- Document rejection reasons for transparency
- Regular backup of moderation data

## Configuration Options

### Admin Config (`src/config/adminConfig.ts`)

```typescript
export const ADMIN_CONFIG = {
  // List of admin UIDs
  ADMIN_UIDS: ["uid1", "uid2"],
  
  // Auto-approve these email domains (optional)
  APPROVED_DOMAINS: ["example.com", "scholar.org"],
  
  // Roles requiring admin approval
  ROLES_REQUIRING_APPROVAL: ['scholar', 'admin'],
  
  // Comment moderation settings
  COMMENT_SETTINGS: {
    AUTO_APPROVE_TRUSTED_USERS: true,
    REQUIRE_APPROVAL_FOR_NEW_USERS: true,
    MAX_COMMENT_LENGTH: 1000
  }
};
```

## Database Structure

### Users Collection
```typescript
{
  uid: string,
  email: string,
  displayName?: string,
  status: 'pending' | 'approved' | 'rejected' | 'suspended',
  role: 'user' | 'scholar' | 'admin',
  createdAt: Timestamp,
  approvedBy?: string,
  approvedAt?: Timestamp,
  rejectionReason?: string
}
```

### Scholar Comments Collection
```typescript
{
  id: string,
  hadithId: string,
  userId: string,
  userName: string,
  content: string,
  status: 'pending' | 'approved' | 'rejected',
  createdAt: Timestamp,
  approvedBy?: string,
  approvedAt?: Timestamp,
  rejectionReason?: string,
  likes?: number,
  replies?: number
}
```

## Troubleshooting

### Access Denied
- Ensure your UID is correctly added to `adminConfig.ts`
- Verify your user role is set to 'admin' in the database
- Try refreshing the page after configuration changes

### Missing Admin Panel
- Check that all routes are properly configured in `App.tsx`
- Verify the `AdminProtectedRoute` component is working
- Ensure Firebase authentication is functioning

### Comment Issues
- Verify the `scholarComments` collection exists in Firestore
- Check that comment submission forms are properly configured
- Ensure moderation workflow is functioning correctly

## Best Practices

1. **Regular Reviews**: Periodically review pending users and comments
2. **Clear Guidelines**: Establish clear approval criteria for both users and content
3. **Documentation**: Keep records of moderation decisions and reasons
4. **Security**: Regularly audit admin access and permissions
5. **Communication**: Provide clear feedback to users about approval decisions

## Support

For technical issues or questions about the admin panel:
1. Check the browser console for error messages
2. Verify Firebase configuration and rules
3. Review the authentication flow
4. Test with different user roles and permissions

---

**Note**: This admin panel is designed for two administrators as requested. You can easily add more admins by including their UIDs in the configuration file.
