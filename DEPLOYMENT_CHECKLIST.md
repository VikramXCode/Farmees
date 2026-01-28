# Vercel Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. File Structure
- [x] All route files copied to `api/routes/` (17 files)
- [x] All model files copied to `api/models/` (12 files)
- [x] All service files copied to `api/services/` (4 files)
- [x] All utility files copied to `api/utils/` (2 files)
- [x] Middleware files in `api/middleware/` (1 file)

### 2. Code Updates
- [x] `api/server.js` updated to use local routes
- [x] Route loading simplified (no backend fallback)
- [x] All imports use relative paths

### 3. Environment Variables (Set in Vercel Dashboard)
Ensure these are configured in your Vercel project settings:

```bash
MONGODB_URI=mongodb+srv://your-connection-string
NODE_ENV=production
GROQ_API_KEY=your-groq-api-key
OPENWEATHER_API_KEY=your-weather-api-key
# Add any other API keys your app needs
```

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 2: Deploy via Git Push
```bash
# Commit all changes
git add .
git commit -m "Fix: Move backend routes to api folder for Vercel deployment"

# Push to your connected Git repository
git push origin main
```

### Option 3: Deploy via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Import Project"
3. Select your Git repository
4. Vercel will auto-detect the configuration
5. Click "Deploy"

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "farmease-api",
  "database": "connected",
  "mongoUri": "configured"
}
```

### 2. Route Loading Status
```bash
curl https://your-app.vercel.app/api/debug/routes
```

Expected response:
```json
{
  "routesLoaded": {
    "auth": "loaded",
    "lands": "loaded",
    "ai-interactions": "loaded",
    "recommendations": "loaded",
    "diseases": "loaded",
    "pests": "loaded",
    "soil": "loaded",
    "crop-recommendations": "loaded",
    "weather": "loaded",
    "ai": "loaded",
    "officers": "loaded",
    "escalations": "loaded",
    "alerts": "loaded",
    "market": "loaded",
    "connect": "loaded",
    "labour": "loaded",
    "analytics": "loaded"
  }
}
```

### 3. Test Key Endpoints
```bash
# Test authentication
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test lands endpoint (replace with valid userId)
curl https://your-app.vercel.app/api/lands/user/USER_ID

# Test weather endpoint (replace with valid landId)
curl https://your-app.vercel.app/api/weather/LAND_ID
```

## 🐛 Troubleshooting

### If routes still fail to load:

1. **Check Vercel Build Logs**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Check "Build Logs" and "Function Logs"

2. **Verify Environment Variables**
   - Go to Project Settings → Environment Variables
   - Ensure all required variables are set
   - Redeploy after adding variables

3. **Check Module Dependencies**
   - Ensure `api/package.json` has all dependencies
   - Run `npm install` in the `api` directory locally to test

4. **Common Issues**
   - **Missing dependencies**: Add to `api/package.json`
   - **Case sensitivity**: Ensure file names match exactly
   - **Relative paths**: Verify all `require()` statements use correct paths

### If database connection fails:

1. **Whitelist Vercel IPs in MongoDB Atlas**
   - Go to MongoDB Atlas → Network Access
   - Add `0.0.0.0/0` to allow all IPs (or specific Vercel IPs)

2. **Check MongoDB URI**
   - Ensure it's properly URL-encoded
   - Verify credentials are correct
   - Test connection string locally

### If API returns 500 errors:

1. **Check Function Logs**
   - Vercel Dashboard → Your Project → Functions
   - Look for error messages

2. **Enable Debug Mode**
   - Add `DEBUG=*` to environment variables
   - Redeploy and check logs

## 📊 Monitoring

After deployment, monitor:

1. **Function Invocations**: Vercel Dashboard → Analytics
2. **Error Rate**: Check for 4xx/5xx responses
3. **Response Times**: Ensure APIs respond quickly
4. **Database Connections**: Monitor MongoDB Atlas metrics

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ All 17 routes show "loaded" status
- ✅ Health endpoint returns "connected" database status
- ✅ No module resolution errors in logs
- ✅ API endpoints respond with correct data
- ✅ Frontend can communicate with backend APIs

## 📝 Notes

- The `backend/` folder remains for local development
- All production code is now in `api/` folder
- Vercel automatically detects and deploys the `api/` folder as serverless functions
- Each route file becomes a separate serverless function
