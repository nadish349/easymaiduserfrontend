# Deploy to Vercel - Step by Step Guide

## Why Deploy to Vercel?

Deploying to Vercel will:
- ✅ Give you a proper domain (your-app.vercel.app)
- ✅ Fix domain authorization issues
- ✅ Make OTP work properly
- ✅ Provide HTTPS (required for Firebase)

## Step 1: Prepare Your Code

### 1.1 Ensure Git is Initialized
```bash
git init
git add .
git commit -m "Initial commit - ready for Vercel deployment"
```

### 1.2 Push to GitHub (if not already)
```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - It will detect Vite automatically
   - Deploy to production: `vercel --prod`

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Vercel will auto-detect Vite settings
6. Click **"Deploy"**

## Step 3: Update Firebase Authorized Domains

After deployment, you'll get a URL like: `your-app.vercel.app`

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **easymaid-booking**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Add your Vercel domain: `your-app.vercel.app`
6. Click **"Add"**

## Step 4: Update API Key Restrictions (If Needed)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **easymaid-booking**
3. Go to **APIs & Services** → **Credentials**
4. Find your API key: `AIzaSyBDBhgIAgzGFmyb5Fl0jaaHyXp6F45TcVE`
5. Click Edit
6. Under **Application restrictions** → **HTTP referrers**:
   - Add: `https://your-app.vercel.app/*`
   - Add: `https://*.vercel.app/*` (for preview deployments)
7. Save

## Step 5: Test OTP on Vercel

1. Visit your deployed app: `https://your-app.vercel.app`
2. Try sending OTP
3. It should work now! ✅

## Environment Variables (If Needed)

If you need to use environment variables:

1. In Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add any needed variables
3. Redeploy

## Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update Firebase Authorized domains with your custom domain
4. Update API key restrictions with your custom domain

## Troubleshooting

### Build Fails
- Check `package.json` scripts are correct
- Ensure `vite.config.ts` is properly configured
- Check Vercel build logs

### OTP Still Not Working
- Verify domain is added to Firebase Authorized domains
- Check API key restrictions include your Vercel domain
- Ensure Identity Toolkit API is enabled
- Clear browser cache and try again

## Quick Deploy Command

```bash
# One command to deploy
vercel --prod
```

Your app will be live at: `https://your-app.vercel.app`








