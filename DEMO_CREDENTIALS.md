# 🎯 Quick Demo Credentials Reference

## For Hackathon Jury Demo

### 🌾 **FARMER ACCOUNT** (Primary Demo)
```
Phone:    9999000001
Password: demo123
```
**Pre-loaded with:**
- 1 demo land: "North Field Demo" (Rice, 2.5 hectares)
- Complete soil analysis reports
- 1 pending labour request (Harvesting, 3 workers needed)

**What to show:**
- Land management with detailed soil data
- Weather forecasts (Pollachi, Coimbatore)
- Crop recommendations based on soil analysis
- Market price analysis (Rice, Coconut)
- Disease diagnosis features
- AI-powered farming assistant
- Labour request creation and management

---

### 👷 **COORDINATOR ACCOUNT** (Primary Labour Coordinator)
```
Phone:    9999000002
Password: demo123
```
**Pre-loaded with:**
- Verified coordinator profile (95% reliability score)
- 5 demo workers (Ram Kumar, Muthu, Selvam, Kumar, Ravi)
- Service area: Pollachi, Coimbatore (25km radius)
- 1 incoming labour request from demo farmer
- Skills: Land preparation, sowing, weeding, harvesting

**What to show:**
- Labour coordination dashboard ONLY
- Worker management (view 5 active workers)
- Incoming labour requests
- Worker assignment features
- Reliability scoring system
- Request acceptance/decline workflow
- Geographic service area management

**No access to:** Farming features, land management, crop recommendations

---

### 🏭 **WORKER/COORDINATOR ACCOUNT** (Secondary Coordinator)
```
Phone:    9999000003
Password: demo123
```
**Pre-loaded with:**
- Verified coordinator profile (88% reliability score)
- 3 demo workers (Ganesan, Prakash, Senthil)
- Service area: Erode, Perundurai (20km radius)
- Skills: Sowing, weeding, pest control, irrigation

**What to show:**
- Alternative coordinator perspective
- Different location (Erode vs Coimbatore)
- Smaller team (3 workers vs 5)
- Different skill specializations
- Can receive labour requests from farmers

**No access to:** Farming features, land management, crop recommendations

---

## 📱 Login Steps

1. Open the application
2. Click on "Login" or navigate to auth page
3. Enter the demo phone number
4. Enter password: `demo123`
5. Click "Login"
6. **You're now in Demo Mode!** All data is mock/simulated

---

## 🎭 Key Features to Demonstrate

### With Farmer Account (9999000001)
1. ✅ View "North Field Demo" land with detailed soil reports
2. ✅ Check real-time weather (returns mock data instantly)
3. ✅ Generate AI crop recommendations for Rice cultivation
4. ✅ Analyze market prices for Rice (₹2,850, trending up) & Coconut
5. ✅ Upload plant images for disease diagnosis
6. ✅ Chat with AI farming assistant
7. ✅ View farm analytics dashboard
8. ✅ Create labour requests (see existing pending harvesting request)

### With Coordinator Account (9999000002)
1. ✅ View 5 active demo workers with skills and availability
2. ✅ See incoming labour request from Demo Farmer
3. ✅ Accept/decline labour requests
4. ✅ Assign specific workers to harvesting task
5. ✅ Track reliability scores (95% coordinator rating)
6. ✅ View service area on map (25km radius in Pollachi)
7. ✅ Handle worker replacements
8. ✅ Monitor completion and feedback
9. ❌ Cannot access farming features

### With Worker/Coordinator Account (9999000003)
1. ✅ View 3 demo workers (different team than Coordinator 1)
2. ✅ Different service location (Erode vs Coimbatore)
3. ✅ Different skill specializations (sowing, weeding, pest control)
4. ✅ Smaller team management (3 workers vs 5)
5. ✅ Lower reliability score (88% vs 95%)
6. ✅ Demonstrate coordinator competition/diversity
7. ❌ Cannot access farming features

---

## 🚀 Demo Mode Benefits

| Feature | Demo Mode | Normal Mode |
|---------|-----------|-------------|
| **Data Source** | Mock/Simulated | Real Database |
| **API Calls** | Pre-defined responses | Actual API calls |
| **Database Impact** | Zero | Full CRUD operations |
| **Start with Farmer (9999000001):** Login → View Land → Check Weather → Get AI Recommendations → View Labour Request
- **Switch to Coordinator (9999000002):** Show incoming request → View 5 workers → Accept request → Assign workers
- **Optional - Labour (9999000003):** Show alternative farmer with different crop/soil → Create new request

### Highlight differences between accounts:
- **Farmer 1:** Rice field, Clay Loam, has pending labour request
- **Coordinator:** Can see and manage the request, assign workers
- **Farmer 2 (Labour):** Cotton field, Sandy Loam, different use case

---

## 💡 Presentation Tips

### Opening (30 seconds)
"We've built FarmEase to solve critical challenges in Indian agriculture. Let me walk you through the key features using a pre-configured farmer account."

### During Demo (2-3 minutes)
- **Focus on user flow:** Login → Land View → Get Recommendations → Check Market
- **Highlight AI features:** Show the AI assistant responding in real-time
- **Show coordinator side:** Switch accounts to demonstrate labour coordination

### Closing (30 seconds)
"This demonstrates the complete farmer experience—from land management to AI-powered recommendations. The platform is production-ready and serving real farmers across India."

---

## 🔄 Quick Account Switching

To switch between demo accounts during presentation:
1. Click profile/logout
2. Return to login page
3. Enter different demo credentials
4. Continue demo seamlessly

**Pro tip:** Open multiple browser tabs with different accounts logged in!

---

## ⚠️ Important Notes

- ✅ Demo credentials are intentionally simple for presentations
- ✅ All demo data is isolated from production
- ✅ Weather shows: Pollachi, Coimbatore (28°C, Partly cloudy)
- ✅ Market shows: Rice ₹2,850 (↑1.8%), Coconut ₹18,500 (↓3.6%)
- ✅ Soil data: pH 6.8, N:55, P:28, K:210 ppm
- ✅ No internet required for demo responses

---

## 🎬 Ready to Present!

Print this card and keep it handy during your hackathon pitch. Good luck! 🚀

**Remember:** Confidence comes from preparation. Test the demo flow at least once before the actual presentation.

---

**Last Updated:** December 27, 2025  
**Status:** ✅ Demo users seeded and ready
