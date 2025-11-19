# Quick Deployment Guide

## Option 1: Deploy to Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to backend directory:
   ```bash
   cd backend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

## Option 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your backend repository
4. Add environment variables in Railway dashboard
5. Deploy

## Option 3: Deploy to Render

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your Git repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy

## Option 4: Deploy to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set RAZORPAY_KEY_ID=your_key
   heroku config:set RAZORPAY_KEY_SECRET=your_secret
   ```
5. Deploy: `git push heroku main`

## Testing the Deployment

After deployment, test your API:

```bash
# Health check
curl https://your-backend-url.com/health

# Should return: {"success":true,"message":"Server is running"}
```

## Update Frontend API URL

After deployment, update your frontend `.env` file:

```env
VITE_API_BASE_URL=https://your-backend-url.com/api
```
