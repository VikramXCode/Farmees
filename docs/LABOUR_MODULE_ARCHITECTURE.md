# Farm Labour Coordination Module - Architecture & Integration

## 1. HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FARM-EASE PLATFORM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  EXISTING SYSTEM                │  NEW: LABOUR COORDINATION MODULE          │
│  ─────────────────              │  ────────────────────────────────         │
│  • Farmer Auth                  │  • Coordinator Auth (role-based)          │
│  • Land Management              │  • Worker Pool Management                 │
│  • Crop Info                    │  • Labour Request Flow                    │
│  • Location/Weather             │  • Assignment & Replacement               │
│  • AI Assistant                 │  • Accountability Tracking                │
│                                 │                                           │
│  ┌─────────┐                    │  ┌─────────────┐    ┌─────────────┐      │
│  │ Farmer  │◄───────────────────┼──│   Request   │───►│ Coordinator │      │
│  └─────────┘                    │  └─────────────┘    └──────┬──────┘      │
│       │                         │         ▲                   │             │
│       │                         │         │                   ▼             │
│  ┌────▼────┐                    │  ┌──────┴──────┐    ┌─────────────┐      │
│  │  Land   │                    │  │  Tracking   │◄───│   Workers   │      │
│  └─────────┘                    │  └─────────────┘    └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. CORE PHILOSOPHY IMPLEMENTATION

### Coordinator as Formal Middleman
- Coordinators are registered entities with accountability
- They manage worker pools (NOT the platform)
- Platform provides: traceability, suggestions, fallback automation
- Real-world coordination remains with coordinator

### Flow Summary
```
Farmer → Creates Request → System Matches Coordinator → Coordinator Assigns Workers
                                    ↓
                    [If worker cancels]
                                    ↓
            System Suggests Replacement → Coordinator Confirms → Done
```

## 3. DATABASE SCHEMA ADDITIONS

### 3.1 User Model Enhancement (Existing: User.js)
Add `role` field to existing User schema:
```javascript
role: { 
  type: String, 
  enum: ['farmer', 'coordinator'], 
  default: 'farmer' 
}
```

### 3.2 New Model: Coordinator (Coordinator.js)
```javascript
{
  userId: ObjectId (ref: User),           // Links to existing User
  name: String,
  phone: String,
  location: {
    district: String,
    area: String,
    coordinates: { lat: Number, lng: Number }
  },
  serviceRadius: Number,                   // km radius they serve
  workerCount: Number,                     // Total workers managed
  skillsOffered: [String],                 // ['transplanting', 'harvesting', etc.]
  
  // Accountability Metrics
  reliabilityScore: Number (0-100),
  totalRequestsHandled: Number,
  successfulCompletions: Number,
  replacementsProvided: Number,
  failedCommitments: Number,
  
  isActive: Boolean,
  isVerified: Boolean,
  verifiedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.3 New Model: Worker (Worker.js)
```javascript
{
  coordinatorId: ObjectId (ref: Coordinator),
  name: String,
  phone: String,
  
  // Skills & Availability
  skills: [{
    type: String,                          // 'transplanting', 'harvesting', etc.
    experienceYears: Number
  }],
  availability: {
    monday: Boolean,
    tuesday: Boolean,
    wednesday: Boolean,
    thursday: Boolean,
    friday: Boolean,
    saturday: Boolean,
    sunday: Boolean
  },
  isStandby: Boolean,                      // Available as backup
  
  // Reliability Tracking
  reliabilityScore: Number (0-100),
  totalAssignments: Number,
  completedAssignments: Number,
  cancelledAssignments: Number,
  
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.4 New Model: LabourRequest (LabourRequest.js)
```javascript
{
  requestId: String (unique),
  farmerId: ObjectId (ref: User),
  landId: String,                          // Links to existing Land
  
  // Request Details
  workType: String,                        // 'transplanting', 'harvesting', etc.
  workersNeeded: Number,
  workDate: Date,
  startTime: String,
  duration: Number,                        // hours
  description: String,
  
  // Assignment
  coordinatorId: ObjectId (ref: Coordinator),
  assignedWorkers: [{
    workerId: ObjectId (ref: Worker),
    status: String,                        // 'assigned', 'confirmed', 'cancelled', 'replaced', 'completed'
    assignedAt: Date,
    replacedBy: ObjectId (ref: Worker),    // If replaced
    replacedAt: Date
  }],
  standbyWorkers: [ObjectId],              // Pre-assigned backups
  
  // Status
  status: String,                          // 'pending', 'accepted', 'assigned', 'in_progress', 'completed', 'cancelled'
  
  // Tracking
  farmerConfirmed: Boolean,
  coordinatorAcceptedAt: Date,
  workStartedAt: Date,
  workCompletedAt: Date,
  
  // Feedback (post-completion)
  farmerRating: Number (1-5),
  farmerFeedback: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3.5 New Model: LabourLog (LabourLog.js)
```javascript
{
  requestId: ObjectId (ref: LabourRequest),
  coordinatorId: ObjectId (ref: Coordinator),
  
  eventType: String,                       // 'request_created', 'coordinator_assigned', 'worker_assigned', 
                                           // 'worker_cancelled', 'replacement_made', 'work_started', 
                                           // 'work_completed', 'request_cancelled'
  eventData: {
    workerId: ObjectId,
    previousWorkerId: ObjectId,
    reason: String,
    notes: String
  },
  
  timestamp: Date
}
```

## 4. BACKEND API ENDPOINTS

### 4.1 Coordinator Management
```
POST   /api/labour/coordinators/register     - Register as coordinator
GET    /api/labour/coordinators/profile      - Get own profile
PUT    /api/labour/coordinators/profile      - Update profile
GET    /api/labour/coordinators/nearby       - Find coordinators (for farmers)
GET    /api/labour/coordinators/:id/stats    - Get coordinator stats
```

### 4.2 Worker Management (Coordinator Only)
```
POST   /api/labour/workers                   - Add worker to pool
GET    /api/labour/workers                   - List own workers
PUT    /api/labour/workers/:id               - Update worker
DELETE /api/labour/workers/:id               - Remove worker
GET    /api/labour/workers/available         - Get available workers for date
GET    /api/labour/workers/standby           - Get standby workers
```

### 4.3 Labour Requests (Farmer)
```
POST   /api/labour/requests                  - Create labour request
GET    /api/labour/requests                  - List own requests
GET    /api/labour/requests/:id              - Get request details
PUT    /api/labour/requests/:id/cancel       - Cancel request
PUT    /api/labour/requests/:id/confirm      - Confirm work completion
PUT    /api/labour/requests/:id/feedback     - Submit feedback
```

### 4.4 Labour Requests (Coordinator)
```
GET    /api/labour/coordinator/requests      - List incoming requests
PUT    /api/labour/coordinator/requests/:id/accept   - Accept request
PUT    /api/labour/coordinator/requests/:id/decline  - Decline request
PUT    /api/labour/coordinator/requests/:id/assign   - Assign workers
PUT    /api/labour/coordinator/requests/:id/replace  - Replace worker
GET    /api/labour/coordinator/requests/:id/suggestions - Get replacement suggestions
PUT    /api/labour/coordinator/requests/:id/start    - Mark work started
PUT    /api/labour/coordinator/requests/:id/complete - Mark work completed
```

### 4.5 Logs & Tracking
```
GET    /api/labour/requests/:id/logs         - Get request event logs
GET    /api/labour/coordinator/stats         - Get own performance stats
```

## 5. FRONTEND COMPONENTS

### 5.1 For Farmers (Minimal UI)
```
src/components/labour/
├── LabourRequestButton.tsx        - Quick action button on HomePage
├── LabourRequestForm.tsx          - Simple form (work type, date, count)
├── LabourRequestStatus.tsx        - View request status
├── LabourRequestHistory.tsx       - Past requests list
└── LabourFeedbackModal.tsx        - Post-work rating

src/pages/
└── LabourPage.tsx                 - Main labour page for farmers
```

### 5.2 For Coordinators
```
src/components/labour/coordinator/
├── CoordinatorDashboard.tsx       - Overview & incoming requests
├── WorkerList.tsx                 - Manage worker pool
├── WorkerForm.tsx                 - Add/edit worker
├── RequestCard.tsx                - Single request view with actions
├── WorkerAssignment.tsx           - Assign workers to request
├── ReplacementSuggestions.tsx     - System-suggested replacements
└── CoordinatorStats.tsx           - Performance metrics

src/pages/
└── CoordinatorPage.tsx            - Main coordinator dashboard
```

### 5.3 Shared Components
```
src/components/labour/shared/
├── WorkTypeSelector.tsx           - Dropdown for work types
├── WorkerCard.tsx                 - Worker info display
├── StatusBadge.tsx                - Request status indicator
└── ReliabilityScore.tsx           - Score display component
```

## 6. INTEGRATION POINTS WITH EXISTING SYSTEM

### 6.1 Authentication (AuthContext.tsx)
```typescript
// Add role to User interface
interface User {
  id: string;
  name: string;
  district: string;
  area: string;
  language: 'english' | 'tamil';
  role: 'farmer' | 'coordinator';  // NEW
}
```

### 6.2 User Model (User.js)
```javascript
// Add role field
role: { 
  type: String, 
  enum: ['farmer', 'coordinator'], 
  default: 'farmer' 
}
```

### 6.3 Navigation (Layout.tsx)
```typescript
// Add conditional navigation based on role
{user?.role === 'coordinator' ? (
  <Link to="/coordinator">Dashboard</Link>
) : (
  <Link to="/labour">Labour</Link>
)}
```

### 6.4 App.tsx Routes
```typescript
// Add new routes
<Route path="/labour" element={<LabourPage />} />
<Route path="/coordinator" element={<CoordinatorPage />} />
```

### 6.5 Land Integration
- Labour requests reference existing `landId`
- Location from Land used for coordinator matching
- Work types can be linked to crop stages

### 6.6 Server.js
```javascript
// Add new route
app.use('/api/labour', require('./routes/labour'));
```

## 7. WORK TYPES (Pre-defined)

```javascript
const WORK_TYPES = [
  'land_preparation',    // நில தயாரிப்பு
  'sowing',              // விதைப்பு
  'transplanting',       // நடவு
  'weeding',             // களையெடுப்பு
  'fertilizing',         // உரமிடுதல்
  'pest_control',        // பூச்சி கட்டுப்பாடு
  'irrigation',          // நீர்ப்பாசனம்
  'harvesting',          // அறுவடை
  'post_harvest',        // அறுவடை பின் வேலை
  'general'              // பொது வேலை
];
```

## 8. REPLACEMENT LOGIC

### Auto-Suggestion Algorithm
```javascript
async function suggestReplacements(requestId, cancelledWorkerId) {
  const request = await LabourRequest.findById(requestId);
  const coordinator = await Coordinator.findById(request.coordinatorId);
  
  // 1. First, check standby workers for this request
  const standbyWorkers = await Worker.find({
    _id: { $in: request.standbyWorkers },
    isActive: true
  });
  
  // 2. Find other available workers with matching skills
  const availableWorkers = await Worker.find({
    coordinatorId: coordinator._id,
    'skills.type': request.workType,
    isActive: true,
    _id: { $nin: request.assignedWorkers.map(w => w.workerId) }
  }).sort({ reliabilityScore: -1 });
  
  // 3. Check availability for the date
  const workDay = getDayOfWeek(request.workDate);
  const eligibleWorkers = availableWorkers.filter(w => 
    w.availability[workDay] === true
  );
  
  return {
    standby: standbyWorkers,
    available: eligibleWorkers.slice(0, 5)  // Top 5 suggestions
  };
}
```

## 9. ACCOUNTABILITY SCORING

### Coordinator Score Calculation
```javascript
function calculateCoordinatorScore(coordinator) {
  const completionRate = coordinator.successfulCompletions / coordinator.totalRequestsHandled;
  const replacementBonus = coordinator.replacementsProvided * 0.01;
  const failurePenalty = coordinator.failedCommitments * 0.05;
  
  return Math.min(100, Math.max(0, 
    (completionRate * 100) + replacementBonus - failurePenalty
  ));
}
```

### Worker Score Calculation
```javascript
function calculateWorkerScore(worker) {
  if (worker.totalAssignments === 0) return 50; // Default for new workers
  
  const completionRate = worker.completedAssignments / worker.totalAssignments;
  const cancellationPenalty = worker.cancelledAssignments * 0.1;
  
  return Math.min(100, Math.max(0,
    (completionRate * 100) - cancellationPenalty
  ));
}
```

## 10. IMPLEMENTATION ORDER

### Phase 1: Database & Models
1. Update User model with role
2. Create Coordinator model
3. Create Worker model
4. Create LabourRequest model
5. Create LabourLog model

### Phase 2: Backend APIs
1. Coordinator registration & profile
2. Worker CRUD operations
3. Labour request creation (farmer)
4. Request acceptance & assignment (coordinator)
5. Replacement suggestions
6. Logging & tracking

### Phase 3: Frontend - Farmer
1. Labour request form
2. Request status view
3. Request history
4. Feedback submission

### Phase 4: Frontend - Coordinator
1. Dashboard
2. Worker management
3. Request handling
4. Assignment interface
5. Replacement workflow

### Phase 5: Integration
1. Navigation updates
2. Route protection by role
3. Testing & refinement
