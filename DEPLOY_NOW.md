# Deploy to Vercel - Run These Commands

## Step 1: Open Terminal in Your Project Folder

1. Open File Explorer
2. Navigate to: `D:\🚩 homeclean frontend and backend\homeclean frontend bug free 🚩\homeclean frontend`
3. Right-click in the folder
4. Select **"Open in Terminal"** or **"Open PowerShell window here"**

## Step 2: Deploy to Vercel

In the terminal, run:

```bash
vercel --prod
```

## Step 3: Follow the Prompts

When Vercel asks:
- **"Set up and deploy?"** → Type `Y` and press Enter
- **"Which scope?"** → Select your account (nadish349)
- **"Link to existing project?"** → Type `N` (to create new) or `Y` (if you have one)
- **"What's your project's name?"** → Press Enter for default or type a name like `easymaid-booking`
- **"In which directory is your code located?"** → Press Enter (current directory)

## Step 4: Wait for Deployment

Vercel will:
1. Install dependencies
2. Build your app
3. Deploy to production

You'll see output like:
```
✅ Production: https://your-app-name.vercel.app [copied to clipboard]
```

## Step 5: Add Domain to Firebase

1. **Copy your Vercel URL** from the output above

2. **Add to Firebase**:
   - Go to: https://console.firebase.google.com/project/easymaid-booking/authentication/settings
   - Scroll to **"Authorized domains"**
   - Click **"Add domain"**
   - Paste your domain (e.g., `your-app-name.vercel.app`)
   - Click **"Add"**

3. **Update API Key** (if it has restrictions):
   - Go to: https://console.cloud.google.com/apis/credentials?project=easymaid-booking
   - Click on your API key: `AIzaSyBDBhgIAgzGFmyb5Fl0jaaHyXp6F45TcVE`
   - Under **Application restrictions** → **HTTP referrers**:
     - Add: `https://your-app-name.vercel.app/*`
   - Click **Save**

## Step 6: Test OTP

1. Visit: `https://your-app-name.vercel.app`
2. Try sending OTP
3. It should work! ✅

## Quick Command Summary

```bash
# From your project directory:
vercel --prod
```

That's it! Your app will be live on Vercel! 🚀








