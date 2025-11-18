# Real Error Diagnosis: auth/invalid-app-credential

## What's Actually Happening

Based on your console logs:
1. ✅ reCAPTCHA v2 is working ("reCAPTCHA verified successfully")
2. ✅ Firebase config is loaded correctly
3. ❌ **Identity Toolkit API call fails with 400 error**
4. ❌ **auth/invalid-app-credential** error

## The Real Problem

The error `auth/invalid-app-credential` with a 400 from `identitytoolkit.googleapis.com` means:

**Your API key is being BLOCKED or the Identity Toolkit API is NOT ENABLED**

This is NOT about:
- ❌ Phone authentication being disabled (it's enabled)
- ❌ reCAPTCHA not working (it's working)
- ❌ Missing features (everything is set up)

This IS about:
- ✅ **API Key Restrictions** - Your API key is restricted and blocking the request
- ✅ **Identity Toolkit API** - Not enabled in Google Cloud Console
- ✅ **Domain Authorization** - Your domain might not be authorized

## Step-by-Step Fix (Do This Now)

### Step 1: Check API Key Restrictions (MOST LIKELY ISSUE)

1. Go to: https://console.cloud.google.com/apis/credentials?project=easymaid-booking
2. Find API key: `AIzaSyBDBhgIAgzGFmyb5Fl0jaaHyXp6F45TcVE`
3. Click on it
4. Check **"Application restrictions"**:
   - If it says "HTTP referrers" → **Change to "None"** (temporarily for testing)
   - Or add: `localhost/*` and `127.0.0.1/*`
5. Check **"API restrictions"**:
   - If it says "Restrict key" → **Change to "Don't restrict key"** (temporarily)
   - OR ensure "Identity Toolkit API" is in the allowed list
6. **SAVE**

### Step 2: Enable Identity Toolkit API (REQUIRED)

1. Go to: https://console.cloud.google.com/apis/library?project=easymaid-booking
2. Search: **"Identity Toolkit API"**
3. Click on it
4. Click **"ENABLE"** button
5. Wait for it to enable (takes a few seconds)

### Step 3: Verify Authorized Domains

1. Go to: https://console.firebase.google.com/project/easymaid-booking/authentication/settings
2. Scroll to **"Authorized domains"**
3. Ensure these are listed:
   - `localhost`
   - `127.0.0.1` (if testing locally)
   - Your production domain (if deployed)

### Step 4: Test Again

1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart dev server
3. Try sending OTP again

## Quick Test to Confirm

After fixing Step 1 and 2, check browser console:
- If you still see 400 error → API key still restricted
- If you see different error → Progress! Check new error
- If OTP sends → SUCCESS! ✅

## Why This Happens

Firebase Phone Auth requires:
1. **Identity Toolkit API** - Handles phone authentication
2. **Unrestricted API key** - Or properly configured restrictions
3. **Authorized domain** - Your domain must be whitelisted

If ANY of these are missing/incorrect → `auth/invalid-app-credential`

## Summary

**The real error is: API Key Restrictions or Identity Toolkit API not enabled**

You DON'T need to enable anything else beyond phone authentication. The issue is purely configuration in Google Cloud Console.









