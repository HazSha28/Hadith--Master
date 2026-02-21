# Firebase Setup Guide for Hadith Master

This guide will help you set up Firebase properly for the Hadith Master application with complete hadiths data.

## 1. Firebase Rules Setup

### Update Firestore Rules

1. Go to Firebase Console → Project → Firestore Database → Rules
2. Replace the existing rules with the content from `firestore.rules`
3. Click **Publish**

### Key Features of the Rules:

- **Admin Access**: Special permissions for admin users
- **Public Read**: Anyone can read hadiths, books, categories
- **Authenticated Write**: Only authenticated users can write personal data
- **Admin-Only Collections**: Books, categories, difficulty levels are admin-only

## 2. Admin Authentication Setup

### Option A: Service Account (Recommended)

1. **Create Service Account**:
   ```bash
   # Go to Firebase Console → Project Settings → Service Accounts
   # Click "Generate new private key"
   # Save as `backend/serviceAccountKey.json`
   ```

2. **Install Firebase Admin SDK**:
   ```bash
   cd backend
   npm install firebase-admin
   ```

3. **Update package.json** to support ES modules:
   ```json
   {
     "type": "module",
     "dependencies": {
       "firebase-admin": "^11.0.0"
     }
   }
   ```

### Option B: Admin Claims

1. **Set Custom Claims** for admin users:
   ```javascript
   // In Firebase Functions or Admin SDK
   await admin.auth().setCustomUserClaims(uid, { admin: true });
   ```

2. **Update Rules** to check admin claims:
   ```javascript
   function isAdmin() {
     return request.auth != null && request.auth.token.admin == true;
   }
   ```

## 3. Deploy the Rules

```bash
cd backend
firebase deploy --only firestore:rules
```

## 4. Upload Hadiths Data

### Using Service Account (Recommended):

```bash
cd backend
node uploadCompleteHadiths.js upload
```

### Using Client Authentication:

```bash
# First authenticate as admin
node uploadCompleteHadiths.js login

# Then upload
node uploadCompleteHadiths.js upload
```

## 5. Verify Setup

### Test Permissions:

```bash
# Test admin access
node uploadCompleteHadiths.js stats

# Test search functionality
node uploadCompleteHadiths.js search "intention"

# Test book-specific queries
node uploadCompleteHadiths.js book "Sahih al-Bukhari"
```

### Check Collections:

```bash
# List all collections stats
node uploadCompleteHadiths.js stats

# Expected output:
# 📊 Hadith Collection Statistics:
#    Total Hadiths: 30
#    By Book:
#      Sahih al-Bukhari: 7
#      Sahih Muslim: 4
#      Sunan Abu Dawud: 2
#      Jami' at-Tirmidhi: 3
#      Sunan an-Nasa'i: 3
#      Sunan Ibn Majah: 5
#    By Category:
#      faith: 3
#      manners: 4
#      prayer: 3
#      charity: 3
#      etc...
```

## 6. Troubleshooting

### Common Issues:

1. **Permission Denied**:
   - Check if service account key is properly configured
   - Verify Firebase rules are published
   - Ensure admin claims are set correctly

2. **Module Import Errors**:
   - Add `"type": "module"` to package.json
   - Use `.js` extension for imports
   - Install required dependencies

3. **Firebase Connection Issues**:
   - Check Firebase project configuration
   - Verify network connectivity
   - Ensure correct project ID

### Debug Commands:

```bash
# Check Firebase connection
node -e "import('./firebaseAdmin.js').then(m => m.verifyAdminAccess())"

# Test individual collection access
node uploadCompleteHadiths.js book "Sahih al-Bukhari"

# Check rules syntax
firebase firestore:rules --test
```

## 7. Security Considerations

### Service Account Security:
- Keep `serviceAccountKey.json` secure and never commit to Git
- Use environment variables in production
- Rotate keys regularly

### Rules Security:
- Principle of least privilege
- Regular security audits
- Monitor access patterns

### Data Validation:
- Input validation on all writes
- Schema validation for hadiths data
- Rate limiting for public endpoints

## 8. Production Setup

### Environment Variables:

```bash
# .env file (never commit to Git)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### CI/CD Integration:

```yaml
# .github/workflows/deploy.yml
- name: Deploy Firebase Rules
  run: |
    cd backend
    firebase deploy --only firestore:rules --token $FIREBASE_TOKEN

- name: Upload Hadiths Data
  run: |
    cd backend
    node uploadCompleteHadiths.js upload
  if: github.ref == 'refs/heads/main'
```

## 9. Monitoring and Maintenance

### Set Up Monitoring:

```javascript
// Firebase Functions for monitoring
exports.monitorHadithAccess = functions.firestore
  .document('hadiths/{hadithId}')
  .onRead((change, context) => {
    // Log access patterns
    console.log(`Hadith ${context.params.hadithId} was accessed`);
  });
```

### Regular Maintenance:

1. **Weekly**: Check collection sizes and performance
2. **Monthly**: Review access logs and security rules
3. **Quarterly**: Update hadiths data and validate authenticity
4. **Annually**: Security audit and permissions review

## 10. Next Steps

Once Firebase is properly set up:

1. **Upload Complete Dataset**: Expand from 30 to full ~34,000 hadiths
2. **Add Search Indexes**: Optimize search performance
3. **Implement Caching**: Reduce Firebase read costs
4. **Add Analytics**: Track usage patterns
5. **Set Up Backups**: Regular data backups and recovery

---

## Quick Start Checklist

- [ ] Firebase project created
- [ ] Firestore database initialized
- [ ] Rules deployed from `firestore.rules`
- [ ] Service account key created and saved
- [ ] Firebase Admin SDK installed
- [ ] Hadiths data uploaded successfully
- [ ] All test commands passing
- [ ] Monitoring and alerts configured

For support, check the [Firebase Documentation](https://firebase.google.com/docs) or review the error logs in the Firebase Console.
