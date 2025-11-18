# Firebase Phone Authentication Setup Checklist

## Error: "Invalid app credentials"

This error occurs when Firebase configuration is incomplete. Follow these steps:

### 1. Enable Phone Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **easymaid-booking**
3. Go to **Authentication** → **Sign-in method**
4. Click on **Phone** provider
5. Ensure it's **Enabled**
6. Click **Save**

### 2. Configure reCAPTCHA
1. In the same **Phone** provider settings
2. Scroll to **reCAPTCHA Enterprise** section
3. Ensure reCAPTCHA is enabled (Firebase automatically configures this)
4. If you see any errors, click **Set up reCAPTCHA Enterprise**

### 3. Authorize Your Domain
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your domain (e.g., `localhost`, your production domain)
3. For local development, `localhost` should already be there
4. If testing on a different port, add `localhost:PORT`

### 4. Verify API Key Restrictions (CRITICAL - Most Common Issue)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **easymaid-booking**
3. Go to **APIs & Services** → **Credentials**
4. Find your API key: `AIzaSyBDBhgIAgzGFmyb5Fl0jaaHyXp6F45TcVE`
5. Click on it to edit
6. Under **Application restrictions**:
   - **IMPORTANT**: For testing, temporarily set to **"None"**
   - If you must use restrictions, add:
     - `localhost/*`
     - `127.0.0.1/*`
     - Your production domain (e.g., `yourdomain.com/*`)
7. Under **API restrictions**:
   - **CRITICAL**: Set to **"Don't restrict key"** for testing
   - OR ensure these APIs are enabled:
     - ✅ **Identity Toolkit API** (REQUIRED)
     - ✅ **Firebase Installations API**
     - ✅ **Firebase Remote Config API**
     - ✅ **Cloud Firestore API**

### 5. Verify Firebase Project Settings
1. Go to Firebase Console → **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Verify your Web app configuration matches:
   - **Project ID**: `easymaid-booking`
   - **App ID**: `1:274564455005:web:a40210f3b8b05ad8cfcbb4`
   - **API Key**: `AIzaSyBDBhgIAgzGFmyb5Fl0jaaHyXp6F45TcVE`

### 6. Check Billing (if applicable)
- Phone authentication requires a paid plan for production
- Free tier has limited SMS quota
- Check **Usage and billing** in Firebase Console

### 7. Remove Test Phone Numbers
1. Go to **Authentication** → **Sign-in method** → **Phone**
2. Scroll to **Phone numbers for testing**
3. **Remove all test phone numbers** (if any)
4. This ensures real OTPs are sent

### 8. Verify Identity Toolkit API (CRITICAL)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **easymaid-booking**
3. Go to **APIs & Services** → **Library**
4. Search for **"Identity Toolkit API"**
5. Click on it and ensure it's **Enabled** (if not, click Enable)
6. Also verify these are enabled:
   - **Firebase Installations API**
   - **Cloud Firestore API**
   - **Firebase Remote Config API**

## Quick Test
After completing the above:
1. Clear browser cache
2. Restart your dev server
3. Try sending OTP again
4. Check browser console for detailed error messages

## Common Issues
- **API key restricted**: Check Google Cloud Console API restrictions
- **Domain not authorized**: Add domain in Firebase Console
- **Phone Auth not enabled**: Enable in Firebase Console
- **reCAPTCHA not configured**: Firebase should auto-configure, but verify
- **Billing quota exceeded**: Check Firebase usage dashboard

