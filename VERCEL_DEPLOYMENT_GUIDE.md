# Vercel Deployment Guide for Farmees

## Current Issues and Solutions

### ❌ Problem 1: Backend is Crashing
**Error**: `FUNCTION_INVOCATION_FAILED` when accessing https://farmees-backend.vercel.app

**Cause**: Missing environment variables in Vercel backend project

**Solution**: Add the following environment variables in Vercel Dashboard for **farmees-backend** project:

#### Required Environment Variables for Backend:

1. **MONGODB_URI** (CRITICAL - backend won't start without this)
   ```
   mongodb+srv://username:password@cluster.mongodb.net/farmease
   ```

2. **GROQ_API_KEYS** (for AI features)
   ```
   your_groq_api_key_1,your_groq_api_key_2
   ```

3. **PLANT_ID_API_KEYS** (for disease detection)
   ```
   your_plant_id_key_1,your_plant_id_key_2
   ```

4. **KINDWISE_API_KEYS** (for pest detection)
   ```
   your_kindwise_key_1,your_kindwise_key_2
   ```

5. **OPENWEATHER_API_KEYS** (for weather data)
   ```
   your_openweather_key_1,your_openweather_key_2
   ```

6. **VITE_DATA_GOV_API_KEY** (optional - for market prices)
   ```
   your_data_gov_key
   ```

### ❌ Problem 2: Frontend Making Requests to Wrong URL
**Error**: `POST https://farmees.vercel.app/api/auth/signin 405/404`

**Cause**: `VITE_API_URL` environment variable not set in Vercel frontend project

**Solution**: Add environment variable in Vercel Dashboard for **farmees** (frontend) project:

```
VITE_API_URL=https://farmees-backend.vercel.app/api
```

## Step-by-Step Deployment Instructions

### Backend Deployment (farmees-backend.vercel.app)

1. **Go to Vercel Dashboard** → farmees-backend project
2. **Settings** → **Environment Variables**
3. **Add all required variables** (listed above)
4. **Redeploy** the project after adding variables

### Frontend Deployment (farmees.vercel.app)

1. **Go to Vercel Dashboard** → farmees project
2. **Settings** → **Environment Variables**
3. **Add**:
   ```
   VITE_API_URL=https://farmees-backend.vercel.app/api
   ```
4. **Redeploy** the project

### Testing After Deployment

1. **Check backend health**:
   ```bash
   curl https://farmees-backend.vercel.app/
   ```
   Should return a response (not error page)

2. **Check frontend**:
   - Open https://farmees.vercel.app
   - Open browser DevTools → Console
   - Look for `[API Config] Final API_BASE_URL: https://farmees-backend.vercel.app/api`
   - Try signup/signin - should work without 405/404 errors

3. **Check console logs**:
   - Should see: `[API Config] Production mode detected, using: https://farmees-backend.vercel.app/api`
   - Should NOT see requests to `farmees.vercel.app/api`

## Project Structure

```
farmees/                         → Frontend (deploy to farmees.vercel.app)
├── src/                         → React frontend code
├── vercel.json                  → Frontend Vercel config
└── .env (NOT committed)         → Local dev only

backend/                         → Backend (deploy to farmees-backend.vercel.app)
├── server.js                    → Express server
├── vercel.json                  → Backend Vercel config
└── env.example                  → Template for environment variables
```

## Vercel Project Settings

### Frontend Project (farmees)
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `.` (project root)
- **Environment Variables**: 
  - `VITE_API_URL=https://farmees-backend.vercel.app/api`

### Backend Project (farmees-backend)
- **Framework**: Other
- **Build Command**: (none needed)
- **Output Directory**: (none needed)
- **Root Directory**: `backend`
- **Environment Variables**: All listed above (MONGODB_URI, API keys, etc.)

## Common Issues

### Issue: "Service is currently unstable"
- Backend is crashing - check Vercel logs
- Usually means missing MONGODB_URI or connection failed

### Issue: "405 Method Not Allowed"
- Frontend is making requests to itself instead of backend
- Fix: Set VITE_API_URL in frontend Vercel dashboard
- Then: Redeploy frontend

### Issue: "404 Not Found"
- Backend endpoint doesn't exist or backend is down
- Check backend deployment logs in Vercel

### Issue: CORS errors
- Backend CORS is configured for:
  - https://farmees.vercel.app
  - https://farm-ease.vercel.app
  - localhost (for development)
- If you use a different domain, update `backend/server.js` CORS config

## Environment Variables Reference

### Backend (.env in backend/)
```env
MONGODB_URI=mongodb+srv://...
GROQ_API_KEYS=key1,key2
PLANT_ID_API_KEYS=key1,key2
KINDWISE_API_KEYS=key1,key2
OPENWEATHER_API_KEYS=key1,key2
VITE_DATA_GOV_API_KEY=key
```

### Frontend (.env in root - LOCAL DEV ONLY)
```env
# For local development
VITE_API_URL=http://localhost:3001/api

# For production, set in Vercel dashboard instead
```

## Security Notes

1. **Never commit `.env` files** - they're in `.gitignore`
2. **Use Vercel Dashboard** to set production environment variables
3. **API keys should be kept secret** - don't expose them in frontend code
4. **Backend API keys** are only accessed server-side (safe)

## Deployment Checklist

- [ ] Backend deployed to farmees-backend.vercel.app
- [ ] All backend environment variables set in Vercel
- [ ] Frontend deployed to farmees.vercel.app  
- [ ] VITE_API_URL set in frontend Vercel settings
- [ ] Both projects redeployed after setting variables
- [ ] Backend health check passes (curl test)
- [ ] Frontend console shows correct API URL
- [ ] Signup/signin works without errors
- [ ] All features tested and working

## Current Status

**Last Updated**: January 28, 2026

**Backend**: ❌ Crashing - needs environment variables
**Frontend**: ❌ Wrong API URL - needs VITE_API_URL set

**Next Steps**:
1. Set MONGODB_URI in backend Vercel project (CRITICAL)
2. Set all API keys in backend Vercel project
3. Set VITE_API_URL in frontend Vercel project
4. Redeploy both projects
5. Test the deployment

## Support

If you encounter issues:
1. Check Vercel deployment logs (Deployments → View Function Logs)
2. Check browser console for `[API Config]` logs
3. Verify environment variables are set correctly
4. Try redeploying after any configuration changes
