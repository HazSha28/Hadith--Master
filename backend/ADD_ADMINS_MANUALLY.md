# Add Admin Users Manually - Firebase Console

Since the script failed due to permissions, please add admins manually:

## Steps to Add Admins:

1. **Go to Firebase Console**
   - URL: https://console.firebase.google.com
   - Select your project: `hadith-master-40045`

2. **Navigate to Firestore**
   - Go to "Build" → "Firestore Database"

3. **Create Admin Collection**
   - Click "Start collection"
   - **Collection ID**: `admins`
   - Click "Next"

4. **Add First Admin**
   - **Document ID**: `9EQwVF9srSQkLd5LWsLmdaPQePd2`
   - **Fields** (click "Add field" for each):
     ```
     Field 1:
     - Field name: `uid`
     - Field type: `string`
     - Value: `9EQwVF9srSQkLd5LWsLmdaPQePd2`
     
     Field 2:
     - Field name: `email`
     - Field type: `string`
     - Value: `tohazsha@gmail.com`
     
     Field 3:
     - Field name: `displayName`
     - Field type: `string`
     - Value: `Admin User 1`
     
     Field 4:
     - Field name: `role`
     - Field type: `string`
     - Value: `admin`
     
     Field 5:
     - Field name: `createdAt`
     - Field type: `timestamp`
     - Value: Click the timestamp button (🕐)
     ```
   - Click "Save"

5. **Add Second Admin**
   - Click "Add document" in the admins collection
   - **Document ID**: `XncNQ5wOQ3VzkEoK0AYuO8j4ngG2`
   - **Fields**:
     ```
     Field 1:
     - Field name: `uid`
     - Field type: `string`
     - Value: `XncNQ5wOQ3VzkEoK0AYuO8j4ngG2`
     
     Field 2:
     - Field name: `email`
     - Field type: `string`
     - Value: `macsabs@gmail.com`
     
     Field 3:
     - Field name: `displayName`
     - Field type: `string`
     - Value: `Admin User 2`
     
     Field 4:
     - Field name: `role`
     - Field type: `string`
     - Value: `admin`
     
     Field 5:
     - Field name: `createdAt`
     - Field type: `timestamp`
     - Value: Click the timestamp button (🕐)
     ```
   - Click "Save"

## Verification:

After adding admins, you should see:
- Collection: `admins`
- 2 documents with the UIDs as document IDs
- Both users should now have admin access

## Test Admin Access:

1. Go to your application: `http://localhost:8080/admin/panel`
2. Login with either admin email
3. You should now see the admin panel

## Current System:

✅ **Users**: Can register without approval
✅ **Admins**: Only those in `admins` collection have admin privileges
✅ **Comments**: Require admin approval before being visible
✅ **Admin Panel**: Accessible at `/admin/panel`

Once you add the admins manually, the system will be fully functional!
