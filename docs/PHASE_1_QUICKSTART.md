# Phase 1 Quick Start Guide

## 🚀 5-Minute Setup

### 1. Dependencies (Already Installed ✅)
```bash
cd backend
npm install  # node-cron already in package.json
```

### 2. Seed Crop Data (Already Done ✅)
```bash
npm run seed:calendars
# Output: ✅ Added 3 crops (Onion, Coconut, Rice)
```

### 3. Start Server
```bash
npm run dev
# You should see:
# ✅ MongoDB connected
# ✅ Notification scheduler started with 3 jobs
# ✅ Server started successfully!
```

---

## 🧪 Test the Features

### Test 1: Auto-Generate Activities
```bash
# Create a plan first (via UI or API)
curl -X POST http://localhost:3001/api/farming-plans \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "cropName": "onion",
    "landId": "test-land-123",
    "startDate": "2024-02-01"
  }'

# Generate activities
curl -X POST http://localhost:3001/api/farming-plans/PLAN_ID/generate-activities \
  -H "Content-Type: application/json" \
  -d '{"season": "all"}'

# Should return 8 activities for onion with dates, costs, bilingual descriptions
```

### Test 2: Get Notifications
```bash
# Check pending notifications
curl http://localhost:3001/api/farming-plans/notifications/user/test-user-123

# Should return empty array (notifications created when activities accepted)
```

### Test 3: AI Suggestions
```bash
curl http://localhost:3001/api/farming-plans/PLAN_ID/activity-suggestions/seed_sowing

# Returns 3-4 AI-powered tips with materials, timing, cost savings
```

### Test 4: Weather Check
```bash
curl -X POST http://localhost:3001/api/farming-plans/PLAN_ID/weather-forecast

# Returns 7-day forecast with farming impact analysis
```

### Test 5: Conflict Detection
```bash
curl -X POST http://localhost:3001/api/farming-plans/PLAN_ID/check-conflicts \
  -H "Content-Type: application/json" \
  -d '{
    "activity": {
      "activityType": "harvesting",
      "scheduledDate": "2024-02-05"
    }
  }'

# Returns conflicts if harvesting scheduled before sowing
```

---

## 📊 Verify Database

### Check Crop Calendars
```bash
# Connect to MongoDB
mongosh farmease

# View seeded crops
db.cropcalendars.find().pretty()
# Should show 3 documents: onion, coconut, rice

# Count activities
db.cropcalendars.aggregate([
  { $project: { crop: "$cropName", count: { $size: "$activities" } } }
])
# Onion: 8, Coconut: 5, Rice: 8
```

### Check Cron Jobs
```bash
# Server logs show execution
[2024-01-15T10:00:00Z] Running hourly notification job
[2024-01-15T10:30:00Z] Running overdue notification job
```

---

## 🎯 End-to-End Flow

### Complete Farming Plan Workflow

1. **Farmer creates plan** (via existing UI)
   ```javascript
   POST /api/farming-plans
   Body: { userId, cropName: "onion", landId, startDate }
   ```

2. **System generates activities** (new feature)
   ```javascript
   POST /api/farming-plans/:planId/generate-activities
   // Returns 8 activities with scheduled dates
   ```

3. **Farmer reviews and accepts** (new feature)
   ```javascript
   POST /api/farming-plans/:planId/accept-generated-activities
   Body: { activities: [...] }
   // Creates 16 notifications (2 per activity)
   ```

4. **System sends reminder** (2 days before) (automated)
   ```
   Cron job processes notification at scheduled time
   Farmer sees: "Upcoming: Seed Sowing in 2 days"
   ```

5. **Farmer gets AI suggestions** (before activity) (new feature)
   ```javascript
   GET /api/farming-plans/:planId/activity-suggestions/seed_sowing
   // Returns materials needed, timing tips, cost savings
   ```

6. **System checks weather** (on activity day) (new feature)
   ```javascript
   POST /api/farming-plans/:planId/weather-check/:activityId
   // Returns: shouldDelay: true if rain expected
   ```

7. **Farmer responds to notification** (new feature)
   ```javascript
   POST /api/farming-plans/notifications/:notificationId/respond
   Body: { action: "completed" }
   // Marks activity complete, calculates progress
   
   // OR reschedule
   Body: { 
     action: "reschedule", 
     newDate: "2024-02-10", 
     reason: "rain" 
   }
   // Creates new notifications for new date
   ```

8. **System sends overdue reminder** (if not completed) (automated)
   ```
   Cron job detects activity past due
   Sends: "Overdue: Seed Sowing was scheduled for 2024-02-05"
   ```

9. **Repeat for all activities** until harvest + sale (100% complete)

---

## 🔧 Troubleshooting

### Server Won't Start
```bash
# Check MongoDB connection
mongosh farmease

# Check port availability
lsof -i :3001
# If in use: kill -9 PID

# Check logs
tail -f backend/logs/error.log
```

### Crop Calendars Empty
```bash
# Re-run seed script
npm run seed:calendars

# Verify
mongosh farmease
db.cropcalendars.countDocuments()  # Should be 3
```

### Notifications Not Created
```bash
# Check if activities added to plan
db.farmingplans.findOne({ _id: ObjectId("PLAN_ID") })

# Check notification creation in server logs
# Should see: "Created reminders for activity: seed_sowing"
```

### Cron Jobs Not Running
```bash
# Check server logs for scheduler start
# Should see: "✅ Notification scheduler started with 3 jobs"

# Manually trigger
# (In production, wait for scheduled time)
```

---

## 📚 Key Files Reference

### Backend Services (in `/backend/services/`)
- `activityPlanningService.js` - Generate activities, detect conflicts
- `notificationService.js` - Create notifications, handle responses
- `weatherAnalysisService.js` - Fetch weather, analyze impacts
- `aiRecommendationService.js` - AI suggestions + fallbacks
- `notificationScheduler.js` - Cron job orchestration

### API Routes (in `/backend/routes/`)
- `farming-plans.js` - All 10 new Phase 1 endpoints

### Database Models (in `/backend/models/`)
- `CropCalendar.js` - Crop activity templates
- `Notification.js` - Notification tracking
- `WeatherSnapshot.js` - Weather audit trail
- `ActivityConflict.js` - Conflict detection

### Documentation (in `/docs/`)
- `PHASE_1_IMPLEMENTATION.md` - Full guide (1,100+ lines)
- `PHASE_1_SUMMARY.md` - Quick reference (500+ lines)
- `PHASE_1_STATUS.md` - Implementation status

---

## 🎓 Learning Resources

### Understand the System
1. Read `/docs/FARMING_PLANS_SYSTEM.md` - System overview
2. Read `/docs/PHASE_1_IMPLEMENTATION.md` - Feature details
3. Check model files - See database schemas
4. Test API routes - Use Postman/curl examples

### Extend the System
1. Add new crop - Create CropCalendar document
2. Add notification type - Update Notification model enum
3. Add conflict rule - Update activityPlanningService
4. Add AI context - Update aiRecommendationService prompt

---

## ✅ Quick Checklist

Before starting frontend development:

- [x] Dependencies installed (node-cron)
- [x] Crop calendars seeded (3 crops)
- [x] Server starts successfully
- [x] Notification scheduler running (3 jobs)
- [x] MongoDB indexes created
- [x] API routes accessible
- [x] Documentation read
- [x] Test endpoints with curl/Postman

---

## 🚀 Next Steps

### For Frontend Developers
1. Build NotificationPanel component
2. Build ActivitySuggestionCard component
3. Build RescheduleModal component
4. Build AutoPlanReview component
5. Integrate with existing FarmingPlansPage

### For Backend Developers
1. Add more crops to CropCalendar
2. Implement SMS/WhatsApp delivery
3. Build admin panel for crop management
4. Add photo upload for activities
5. Implement voice input

---

## 💡 Tips

- **Test with real dates:** Use dates 2-3 days in future to see reminders
- **Check cron logs:** Server console shows job execution
- **MongoDB Compass:** Visual tool for viewing data
- **Postman Collection:** Save API requests for quick testing
- **Read responses:** All API responses have bilingual content

---

## 📞 Support

Issues? Check:
1. Server logs for errors
2. MongoDB connection
3. Environment variables (.env)
4. API route documentation
5. Troubleshooting section above

---

**Phase 1 Backend: READY TO USE** 🎉

Start building the frontend integration now!
