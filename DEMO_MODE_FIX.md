# Demo Mode Fix - API Headers

## Problem
The `isDemo: true` flag was correctly stored in localStorage, but the UI was not showing mock data because the frontend was not sending the `X-Demo-Mode` header with API requests.

## Root Cause
- Backend middleware (`backend/middleware/demoMode.js`) checks for `X-Demo-Mode: true` header
- Frontend services were using raw `axios` or `fetch()` calls without the configured axios instance
- The axios instance in `src/services/api.ts` had the header logic but wasn't being used

## Solution Implemented

### 1. Created Helper Function
**File:** `src/services/api.ts`
- Added `getApiHeaders()` function that returns headers with `X-Demo-Mode: true` when user has `isDemo: true` in localStorage
- This function can be used by any service using raw `fetch()`

### 2. Updated Services to Use Configured API Instance

#### Services Updated to Use `api` (axios instance):
- ✅ **weatherService.ts** - All 5 axios.get calls now use `api.get`
- ✅ **cropRecommendationService.ts** - All 7 axios calls now use `api`
- ✅ **marketService.ts** - All 2 axios.get calls now use `api.get`
- ✅ **escalationService.ts** - All 3 axios calls now use `api`

#### Services Updated to Use `getApiHeaders()`:
- ✅ **landService.ts** - All 10 fetch() calls now include `getApiHeaders()`
- ✅ **authService.ts** - signup() and signin() now use `getApiHeaders()`
- ✅ **soilService.ts** - uploadSoilReport() now uses `getApiHeaders()` (excluding Content-Type for FormData)
- ✅ **aiService.ts** - generate() method now uses `getApiHeaders()` for backend AI calls

#### Already Correct:
- ✅ **labourService.ts** - Already imports and uses `api` instance

## How It Works

### For axios-based services:
```typescript
import api from './api';

// The api instance automatically adds X-Demo-Mode header from localStorage
const response = await api.get('/endpoint');
```

### For fetch-based services:
```typescript
import { getApiHeaders } from './api';

const response = await fetch('/api/endpoint', {
  headers: getApiHeaders() // Includes X-Demo-Mode if isDemo is true
});
```

## Testing Steps

1. **Restart Frontend** (if Vite dev server is running):
   ```bash
   # Frontend will hot-reload automatically, but if issues persist:
   Ctrl+C in terminal and restart with: npm run dev
   ```

2. **Clear localStorage and login**:
   ```javascript
   localStorage.clear();
   // Then login with: 9999000001 / demo123
   ```

3. **Verify Headers in Browser DevTools**:
   - Open Network tab
   - Login with demo credentials
   - Make API calls (check weather, market, etc.)
   - Look for `X-Demo-Mode: true` in Request Headers

4. **Verify Mock Data**:
   - Weather should load instantly (< 50ms)
   - Market data should return mock prices
   - AI assistant should respond instantly with predefined messages
   - All data should appear without real API delays

## Expected Behavior

### Demo User (9999000001):
- All API responses return mock data
- Response times < 50ms (no external API calls)
- Weather shows "Pollachi, Coimbatore" mock weather
- Market shows 20+ mock commodity prices
- AI chat has 10 predefined responses

### Non-Demo Users:
- Normal API behavior
- Real external API calls
- Normal response times
- No mock data

## Files Modified

### Core Files:
1. `src/services/api.ts` - Added `getApiHeaders()` helper
2. `src/services/weatherService.ts` - Changed from `axios` to `api` instance
3. `src/services/cropRecommendationService.ts` - Changed from `axios` to `api` instance
4. `src/services/marketService.ts` - Changed from `axios` to `api` instance
5. `src/services/escalationService.ts` - Changed from `axios` to `api` instance
6. `src/services/landService.ts` - Added `getApiHeaders()` to all fetch calls
7. `src/services/authService.ts` - Added `getApiHeaders()` to auth calls
8. `src/services/soilService.ts` - Added `getApiHeaders()` to upload
9. `src/services/aiService.ts` - Added `getApiHeaders()` to AI generate

## Verification Checklist

- [ ] localStorage shows `isDemo: true` for demo users
- [ ] Network tab shows `X-Demo-Mode: true` header in requests
- [ ] Weather loads instantly with mock data
- [ ] Market data shows mock prices
- [ ] AI assistant responds with predefined messages
- [ ] Crop recommendations show mock data
- [ ] Disease diagnosis shows mock results
- [ ] Soil reports show mock analysis
- [ ] Labour module shows mock coordinators/workers
- [ ] Connect feature shows mock network data

## Notes

- The axios interceptor in `api.ts` automatically attaches the header for all axios-based requests
- For FormData requests (like file uploads), we must exclude `Content-Type` header to let the browser set the multipart boundary
- The `getApiHeaders()` function is pure and has no side effects - safe to call multiple times
- Backend middleware caches demo data in memory for instant responses
