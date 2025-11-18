# Deploy Directly to Vercel (No GitHub Required)

## Quick Deploy Steps

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
This will open a browser for you to login.

### Step 3: Deploy from Your Project Directory
```bash
vercel
```
- Follow the prompts
- It will ask if you want to link to existing project or create new
- Choose your options
- It will deploy!

### Step 4: Deploy to Production
```bash
vercel --prod
```

## What You'll Get

After deployment, you'll get:
- **Preview URL**: `your-app-xxxxx.vercel.app` (for testing)
- **Production URL**: `your-app.vercel.app` (main URL)

## After Deployment

1. **Copy your Vercel domain** (e.g., `your-app.vercel.app`)

2. **Add to Firebase Authorized Domains**:
   - Go to: https://console.firebase.google.com/project/easymaid-booking/authentication/settings
   - Scroll to "Authorized domains"
   - Click "Add domain"
   - Add: `your-app.vercel.app`
   - Click "Add"

3. **Update API Key** (if restricted):
   - Go to: https://console.cloud.google.com/apis/credentials?project=easymaid-booking
   - Edit your API key
   - Add to HTTP referrers: `https://your-app.vercel.app/*`
   - Save

4. **Test OTP** on your Vercel URL!

## That's It!

No GitHub needed - direct deployment from your computer to Vercel! 🚀








