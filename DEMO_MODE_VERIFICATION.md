# Demo Mode Verification Guide

## ✅ Step-by-Step Verification

### 1. Check Backend is Running
Open terminal and verify:
```
Backend should be running on http://localhost:3001
Frontend should be running on http://localhost:5173
```

### 2. Test Demo Login
1. Open browser to `http://localhost:5173`
2. Click Login
3. Enter Phone: `9999000001`
4. Enter Password: `demo123`
5. Click Login

### 3. Verify Demo Mode is Active

#### In Browser DevTools (F12):
1. Go to **Console** tab
2. Type: `JSON.parse(localStorage.getItem('farmease_user'))`
3. You should see: `isDemo: true` in the output

#### In Network Tab:
1. Open **Network** tab in DevTools
2. Click on any API request (like `/api/lands/user/...`)
3. Look at **Request Headers**
4. You should see: `X-Demo-Mode: true`

### 4. Test Mock Data is Returning

#### Test Weather:
1. Navigate to Home page
2. Weather should show instantly (no loading delay)
3. Should show: **Pollachi, Coimbatore, 28°C, Partly cloudy**

#### Test Market:
1. Scroll to Market Analysis section
2. Should show instantly:
   - **Rice: ₹2,850** (↑1.8%)
   - **Coconut: ₹18,500** (↓3.6%)

#### Test Crop Recommendations:
1. Click "Get AI Recommendation" button
2. Should respond instantly (no waiting)
3. Should mention: "Rice (Paddy) - HIGHLY SUITABLE"

#### Test AI Chat:
1. Go to AI Assistant
2. Type: "irrigation"
3. Should respond instantly with detailed irrigation advice

### 5. Test Coordinator Login
1. Logout from farmer account
2. Login with Phone: `9999000002`, Password: `demo123`
3. Should see **Coordinator Dashboard** (NOT farmer dashboard)
4. Should see 5 workers listed
5. Should see 1 pending labour request

---

## 🐛 Troubleshooting

### If Demo Mode is Not Working:

#### Problem: No `isDemo: true` in localStorage
**Solution:**
1. Clear browser cache
2. Logout completely
3. Re-login with demo credentials
4. Check backend logs to ensure demo user exists

#### Problem: No `X-Demo-Mode` header in requests
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check if `isDemo: true` is in localStorage
3. Restart frontend dev server

#### Problem: Still seeing real API calls (loading delays)
**Solution:**
1. Restart backend server (it needs to load the middleware)
2. Check backend console for errors
3. Verify middleware is applied: Check `server.js` line 29

#### Problem: Mock data not showing
**Solution:**
1. Open Network tab → Click any API call
2. Check **Response** body
3. If you see real data instead of mock, backend middleware isn't applying
4. Restart backend with: `cd backend && npm run dev`

---

## 🎯 Expected Behavior

### Farmer Account (9999000001):
✅ Instant weather (no loading spinner)
✅ Instant market prices
✅ Instant AI responses
✅ See "North Field Demo" land
✅ See 1 pending labour request
✅ All responses under 50ms

### Coordinator Account (9999000002):
✅ See coordinator dashboard only
✅ See 5 workers (Ram Kumar, Muthu, Selvam, Kumar, Ravi)
✅ See 1 incoming request
✅ NO access to farming features
✅ Cannot see land management

### Worker Coordinator (9999000003):
✅ See coordinator dashboard only
✅ See 3 workers (Ganesan, Prakash, Senthil)
✅ Different location (Erode)
✅ NO access to farming features

---

## 📝 Quick Test Checklist

Copy this and check off as you test:

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Login with 9999000001/demo123 works
- [ ] `isDemo: true` in localStorage
- [ ] `X-Demo-Mode: true` in network headers
- [ ] Weather shows instantly with mock data
- [ ] Market prices show instantly
- [ ] Crop recommendation responds instantly
- [ ] AI chat responds instantly
- [ ] Coordinator login (9999000002) shows dashboard
- [ ] Coordinator sees 5 workers
- [ ] No farming features for coordinator

If ALL boxes are checked ✅ = Demo Mode is working perfectly!

---

## 🔥 Force Fresh Start

If nothing works, do this:

```powershell
# 1. Stop all servers (Ctrl+C in all terminals)

# 2. Clear everything
cd D:\Projects\farm-ease
Remove-Item node_modules/.vite -Recurse -Force -ErrorAction SilentlyContinue

# 3. Restart backend
cd backend
npm run dev

# 4. In new terminal, restart frontend
cd D:\Projects\farm-ease
npm run dev

# 5. Open browser in incognito mode
# Navigate to http://localhost:5173
# Login with 9999000001/demo123
```

---

**Last Updated:** December 27, 2025
