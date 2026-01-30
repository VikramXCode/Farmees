# Phase 2.0 Technical Design Document

**Status**: Design Phase - No Implementation Yet  
**Date**: January 31, 2026  
**Version**: 1.0  
**Scope**: Expense Tracking, Labour Management, Offline-First Sync (Must-Have Only)

---

## Executive Summary

Phase 2.0 implements three core financial management features that directly address farmer pain points:

1. **Expense Tracking** - Real-time budget monitoring with alerts
2. **Labour Management** - Worker attendance and payment tracking
3. **Offline-First Sync** - Full offline capability with simple conflict resolution

**Timeline**: 6-8 weeks  
**Constraint**: Zero modifications to Phase 1 backend/frontend  
**Strategy**: Build parallel services that consume Phase 1 APIs

---

## Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                Phase 2.0 Frontend (React)                    │
├─────────────────────────────────────────────────────────────┤
│  New Components:                                             │
│  - ExpenseTracker/*    (5 components)                        │
│  - LabourManagement/*  (5 components)                        │
│  - Offline/*           (3 components)                        │
│                                                               │
│  Enhanced Pages:                                             │
│  - FarmingPlanDetailPage (add expense/labour tabs)          │
│  - FarmingPlansPage      (add quick stats)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Offline-First Service Layer (NEW)               │
│  - offlineWrapper()     - Wraps all API calls                │
│  - syncManager()        - Orchestrates sync                  │
│  - storageManager()     - IndexedDB operations               │
│  - conflictResolver()   - Last-write-wins logic              │
└─────────────────────────────────────────────────────────────┘
         │                         │                   │
         ▼                         ▼                   ▼
┌──────────────┐     ┌──────────────────┐    ┌────────────────┐
│ expenseService│     │ labourService    │    │ syncService    │
│ .ts           │     │ .ts              │    │ .ts            │
└──────────────┘     └──────────────────┘    └────────────────┘
         │                         │                   │
         ▼                         ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Phase 2.0 Backend APIs (NEW)                    │
│  /api/expenses/*                                             │
│  /api/labour/workers/*                                       │
│  /api/labour/attendance/*                                    │
│  /api/labour/payments/*                                      │
│  /api/sync/*                                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              MongoDB Collections (NEW)                       │
│  - expenses                                                  │
│  - workers                                                   │
│  - attendance                                                │
│  - syncQueue                                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│        Phase 1 Components (UNTOUCHED - READ ONLY)           │
│  - Farming Plans (read for planId, budget, activities)      │
│  - Activities (read for activity names, dates)              │
│  - Notifications (trigger expense/payment alerts)           │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature 1: Expense Tracking

### Business Requirements

**Core Functionality**:
- Log expenses with category, amount, date, notes
- Compare actual spending vs plan budget
- Alert when 80% budget used
- Category-wise breakdown visualization
- Export data for loan applications

**Success Criteria**:
- Expense logged in <10 seconds (including offline)
- Budget status visible on plan detail page
- Alerts appear within 1 minute of threshold breach

---

### Backend API Design

#### 1.1 Create Expense

**Endpoint**: `POST /api/expenses`

**Request Body**:
```json
{
  "planId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "category": "fertilizer",
  "amount": 1200,
  "date": "2026-01-30T10:30:00.000Z",
  "description": "Urea 50kg bag",
  "notes": "Bought from Ramasamy shop",
  "activityId": "507f1f77bcf86cd799439013",  // optional - link to Phase 1 activity
  "receiptPhoto": null  // Phase 2.0: always null, Phase 2.2: add photo upload
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "expense": {
    "_id": "507f1f77bcf86cd799439014",
    "planId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "category": "fertilizer",
    "amount": 1200,
    "date": "2026-01-30T10:30:00.000Z",
    "description": "Urea 50kg bag",
    "notes": "Bought from Ramasamy shop",
    "activityId": "507f1f77bcf86cd799439013",
    "createdAt": "2026-01-30T10:35:22.000Z",
    "updatedAt": "2026-01-30T10:35:22.000Z",
    "syncedAt": "2026-01-30T10:35:22.000Z"
  },
  "budgetStatus": {
    "totalBudget": 50000,
    "totalSpent": 38700,
    "remaining": 11300,
    "percentageUsed": 77.4,
    "alertTriggered": false
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid category, negative amount, future date
- `404 Not Found`: planId or userId doesn't exist
- `409 Conflict`: Expense would exceed budget by 200%+ (safety check)

**Backend Logic**:
1. Validate request data (category enum, amount > 0, date <= today)
2. Verify planId exists (read-only check on Phase 1 farmingPlans collection)
3. Create expense document in `expenses` collection
4. Calculate updated budget status:
   - Sum all expenses for this planId
   - Compare vs plan.totalBudget
   - If percentageUsed >= 80%, set alertTriggered = true
5. If alert triggered, create Phase 1 notification (via Phase 1 API):
   ```javascript
   POST /api/farming-plans/notifications
   {
     type: 'budget_alert',
     priority: 'high',
     message: 'Budget 80% used - ₹38,700 of ₹50,000 spent'
   }
   ```
6. Return expense + budgetStatus

**Database Operation**:
```javascript
// Create expense
await db.expenses.insertOne({
  planId: ObjectId(planId),
  userId: ObjectId(userId),
  category,
  amount,
  date: new Date(date),
  description,
  notes,
  activityId: activityId ? ObjectId(activityId) : null,
  createdAt: new Date(),
  updatedAt: new Date(),
  syncedAt: new Date()
});

// Calculate budget status
const totalSpent = await db.expenses.aggregate([
  { $match: { planId: ObjectId(planId) } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);

// Get plan budget (Phase 1 collection - read only)
const plan = await db.farmingPlans.findOne({ _id: ObjectId(planId) }, { totalBudget: 1 });
```

---

#### 1.2 List Expenses

**Endpoint**: `GET /api/expenses/plan/:planId`

**Query Parameters**:
- `category` (optional): Filter by category (e.g., `fertilizer`)
- `startDate` (optional): Filter expenses >= this date
- `endDate` (optional): Filter expenses <= this date
- `limit` (optional, default: 50): Max records to return
- `skip` (optional, default: 0): Pagination offset

**Response** (200 OK):
```json
{
  "success": true,
  "expenses": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "category": "fertilizer",
      "amount": 1200,
      "date": "2026-01-30T10:30:00.000Z",
      "description": "Urea 50kg bag",
      "notes": "Bought from Ramasamy shop",
      "activityId": "507f1f77bcf86cd799439013",
      "createdAt": "2026-01-30T10:35:22.000Z"
    }
    // ... more expenses
  ],
  "total": 45,
  "limit": 50,
  "skip": 0
}
```

**Backend Logic**:
1. Build MongoDB query with filters
2. Sort by date descending (newest first)
3. Apply pagination (skip, limit)
4. Return array of expenses

---

#### 1.3 Get Budget Status

**Endpoint**: `GET /api/expenses/budget-status/:planId`

**Response** (200 OK):
```json
{
  "success": true,
  "budgetStatus": {
    "totalBudget": 50000,
    "totalSpent": 38700,
    "remaining": 11300,
    "percentageUsed": 77.4,
    "categoryBreakdown": [
      { "category": "labour", "amount": 15000, "percentage": 38.8 },
      { "category": "fertilizer", "amount": 12200, "percentage": 31.5 },
      { "category": "seeds", "amount": 8000, "percentage": 20.7 },
      { "category": "pesticides", "amount": 2500, "percentage": 6.5 },
      { "category": "equipment", "amount": 1000, "percentage": 2.6 }
    ],
    "alertLevel": "warning",  // ok | warning | danger
    "lastExpenseDate": "2026-01-30T10:30:00.000Z"
  }
}
```

**Alert Levels**:
- `ok`: percentageUsed < 70%
- `warning`: 70% <= percentageUsed < 90%
- `danger`: percentageUsed >= 90%

**Backend Logic**:
1. Get plan budget (Phase 1 collection)
2. Aggregate expenses by category
3. Calculate percentages
4. Determine alert level
5. Get last expense date

---

#### 1.4 Update Expense

**Endpoint**: `PUT /api/expenses/:expenseId`

**Request Body**: Same as Create, but all fields optional

**Response** (200 OK):
```json
{
  "success": true,
  "expense": { /* updated expense */ },
  "budgetStatus": { /* recalculated */ }
}
```

**Backend Logic**:
1. Find expense by ID
2. Verify ownership (userId matches)
3. Update fields
4. Recalculate budget status
5. Update syncedAt timestamp

---

#### 1.5 Delete Expense

**Endpoint**: `DELETE /api/expenses/:expenseId`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Expense deleted",
  "budgetStatus": { /* recalculated */ }
}
```

**Backend Logic**:
1. Find expense by ID
2. Verify ownership
3. Soft delete (set `deletedAt` timestamp, don't remove from DB)
4. Recalculate budget status

---

#### 1.6 Export Expenses

**Endpoint**: `GET /api/expenses/export/:planId`

**Query Parameters**:
- `format`: `csv` or `pdf` (Phase 2.0: CSV only, PDF in 2.1)

**Response** (200 OK):
```
Content-Type: text/csv
Content-Disposition: attachment; filename="expenses_paddy_plan_2026.csv"

Date,Category,Description,Amount,Notes
2026-01-30,Fertilizer,Urea 50kg bag,1200,Bought from Ramasamy shop
2026-01-28,Labour,Weeding workers,3000,5 workers × ₹600
...
```

**Backend Logic**:
1. Fetch all expenses for plan
2. Format as CSV (headers + rows)
3. Set proper Content-Type and filename
4. Stream to response

---

### Database Schema: Expenses Collection

```javascript
{
  _id: ObjectId,
  planId: ObjectId,           // Phase 1 farming plan
  userId: ObjectId,           // farmer who logged expense
  category: String,           // enum: seeds, fertilizer, pesticides, labour, equipment, transport, other
  amount: Number,             // in rupees, positive only
  date: Date,                 // when expense occurred (not createdAt)
  description: String,        // short text, max 200 chars
  notes: String,              // optional long text, max 1000 chars
  activityId: ObjectId,       // optional link to Phase 1 activity
  receiptPhoto: String,       // URL to photo (Phase 2.0: null, Phase 2.2: S3 URL)
  createdAt: Date,            // when logged in system
  updatedAt: Date,            // last edit timestamp
  syncedAt: Date,             // last sync from offline (for conflict resolution)
  deletedAt: Date             // soft delete timestamp (null if active)
}

// Indexes for performance
{
  "planId": 1,
  "date": -1
}
{
  "userId": 1,
  "createdAt": -1
}
{
  "planId": 1,
  "category": 1
}
```

**Category Enum**:
- `seeds` - Seed purchase
- `fertilizer` - Fertilizers, compost, manure
- `pesticides` - Pesticides, herbicides, insecticides
- `labour` - Daily wage payments
- `equipment` - Tractor rental, tool purchase
- `transport` - Transportation costs
- `other` - Miscellaneous expenses

---

### Frontend Service: expenseService.ts

```typescript
// /src/services/expenseService.ts

export interface Expense {
  _id: string;
  planId: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  date: string;  // ISO 8601
  description: string;
  notes?: string;
  activityId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 
  | 'seeds' 
  | 'fertilizer' 
  | 'pesticides' 
  | 'labour' 
  | 'equipment' 
  | 'transport' 
  | 'other';

export interface BudgetStatus {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  categoryBreakdown: CategoryBreakdown[];
  alertLevel: 'ok' | 'warning' | 'danger';
  lastExpenseDate?: string;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
}

export interface CreateExpenseRequest {
  planId: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  notes?: string;
  activityId?: string;
}

// Create expense (online or offline)
export async function createExpense(data: CreateExpenseRequest): Promise<{ 
  expense: Expense; 
  budgetStatus: BudgetStatus 
}> {
  const url = `${API_BASE_URL}/expenses`;
  const response = await offlineWrapper(
    () => fetch(url, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(data)
    }),
    {
      action: 'create_expense',
      collection: 'expenses',
      data,
      fallback: () => {
        // Offline: save to IndexedDB, return optimistic response
        const tempId = `temp_${Date.now()}`;
        const tempExpense: Expense = {
          _id: tempId,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return {
          expense: tempExpense,
          budgetStatus: calculateOfflineBudgetStatus(data.planId)  // use cached plan data
        };
      }
    }
  );
  
  return response.json();
}

// List expenses
export async function getExpenses(
  planId: string, 
  filters?: { category?: ExpenseCategory; startDate?: string; endDate?: string }
): Promise<{ expenses: Expense[]; total: number }> {
  const params = new URLSearchParams({ planId, ...filters });
  const url = `${API_BASE_URL}/expenses/plan/${planId}?${params}`;
  
  const response = await offlineWrapper(
    () => fetch(url, { headers: getApiHeaders() }),
    {
      action: 'fetch_expenses',
      fallback: () => {
        // Offline: return from IndexedDB
        return getOfflineExpenses(planId, filters);
      }
    }
  );
  
  return response.json();
}

// Get budget status
export async function getBudgetStatus(planId: string): Promise<BudgetStatus> {
  const url = `${API_BASE_URL}/expenses/budget-status/${planId}`;
  
  const response = await offlineWrapper(
    () => fetch(url, { headers: getApiHeaders() }),
    {
      action: 'fetch_budget',
      fallback: () => calculateOfflineBudgetStatus(planId)
    }
  );
  
  return response.json();
}

// Update expense
export async function updateExpense(
  expenseId: string, 
  updates: Partial<CreateExpenseRequest>
): Promise<{ expense: Expense; budgetStatus: BudgetStatus }> {
  const url = `${API_BASE_URL}/expenses/${expenseId}`;
  
  const response = await offlineWrapper(
    () => fetch(url, {
      method: 'PUT',
      headers: getApiHeaders(),
      body: JSON.stringify(updates)
    }),
    {
      action: 'update_expense',
      collection: 'expenses',
      data: { expenseId, updates },
      fallback: () => updateOfflineExpense(expenseId, updates)
    }
  );
  
  return response.json();
}

// Delete expense
export async function deleteExpense(expenseId: string): Promise<{ success: boolean }> {
  const url = `${API_BASE_URL}/expenses/${expenseId}`;
  
  const response = await offlineWrapper(
    () => fetch(url, { method: 'DELETE', headers: getApiHeaders() }),
    {
      action: 'delete_expense',
      collection: 'expenses',
      data: { expenseId },
      fallback: () => deleteOfflineExpense(expenseId)
    }
  );
  
  return response.json();
}

// Export expenses (online only)
export function exportExpensesURL(planId: string, format: 'csv' | 'pdf'): string {
  return `${API_BASE_URL}/expenses/export/${planId}?format=${format}`;
}
```

---

### Frontend Components

#### 1. ExpenseEntryModal.tsx

**Purpose**: Quick expense logging form

**Props**:
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  activityId?: string;  // pre-fill if logging expense for specific activity
  onSuccess: (expense: Expense) => void;
}
```

**UI Structure**:
```
┌─────────────────────────────────────────┐
│  Add Expense                         [X]│
├─────────────────────────────────────────┤
│                                          │
│  Amount (₹) *                            │
│  [____________]  [Voice 🎤]             │
│                                          │
│  Category *                              │
│  [v Fertilizer    ]                     │
│                                          │
│  Date *                                  │
│  [Jan 30, 2026   ] 📅                   │
│                                          │
│  Description                             │
│  [Urea 50kg bag ___________]            │
│                                          │
│  Notes (optional)                        │
│  [Bought from Ramasamy shop]            │
│  [_________________________]            │
│                                          │
│  Linked Activity (optional)              │
│  [v Fertilizer Application  ]           │
│                                          │
│  [Cancel]              [Add Expense]    │
└─────────────────────────────────────────┘
```

**Key Features**:
- Voice input for amount (Phase 2.2)
- Category dropdown with icons (🌱 Seeds, 🧪 Fertilizer, etc.)
- Date picker (default: today, max: today)
- Auto-suggest description based on category
- Link to Phase 1 activity (optional)
- Validation: amount > 0, category required, date <= today
- Submit triggers: `createExpense()` → show success toast → close modal
- Offline: Shows "Saved - will sync when online" message

**Bilingual Support**:
- All labels in Tamil/English
- Category names translated
- Success message: "Expense added!" / "செலவு சேர்க்கப்பட்டது!"

---

#### 2. ExpenseList.tsx

**Purpose**: Display all expenses for a plan with filters

**Props**:
```typescript
interface Props {
  planId: string;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}
```

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│  Expenses (45)                  [+ Add] [Export] │
├───────────────────────────────────────────────────┤
│  Filter: [All Categories v] [All Dates v]        │
├───────────────────────────────────────────────────┤
│  📅 Jan 30, 2026                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🧪 Fertilizer                     ₹1,200   │ │
│  │ Urea 50kg bag                              │ │
│  │ Note: Bought from Ramasamy shop            │ │
│  │                        [Edit] [Delete]     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  📅 Jan 28, 2026                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ 👷 Labour                         ₹3,000   │ │
│  │ Weeding workers (5 workers)                │ │
│  │ Activity: Weeding                          │ │
│  │                        [Edit] [Delete]     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  [Load More] (45 of 50)                          │
└───────────────────────────────────────────────────┘
```

**Key Features**:
- Category filter dropdown (All, Seeds, Fertilizer, etc.)
- Date range filter (Last 7 days, Last 30 days, All, Custom)
- Grouped by date (newest first)
- Each expense card shows: icon, category, amount, description, notes, linked activity
- Edit button opens ExpenseEntryModal in edit mode
- Delete button shows confirmation: "Delete expense ₹1,200 for Fertilizer?"
- Pagination: Load 20 at a time
- Export button downloads CSV
- Empty state: "No expenses logged yet. Click + Add to get started."

**Offline Behavior**:
- Shows cached expenses
- Displays badge "Offline - 3 pending sync" if sync queue not empty
- Edit/delete queued for sync

---

#### 3. BudgetProgressBar.tsx

**Purpose**: Visual budget status indicator

**Props**:
```typescript
interface Props {
  totalBudget: number;
  totalSpent: number;
  percentageUsed: number;
  alertLevel: 'ok' | 'warning' | 'danger';
}
```

**UI Structure**:
```
┌───────────────────────────────────────────────┐
│  Budget Status                                │
├───────────────────────────────────────────────┤
│                                               │
│  ₹38,700 of ₹50,000 spent                   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  77%  │
│  ₹11,300 remaining                           │
│                                               │
│  ⚠️ Warning: Approaching budget limit         │
│                                               │
└───────────────────────────────────────────────┘
```

**Color Coding**:
- **Green** (0-69%): On track
- **Yellow** (70-89%): Warning - approaching limit
- **Red** (90-100%+): Danger - budget exceeded or nearly exceeded

**Alert Messages** (bilingual):
- `ok`: "On track - good budget management!"
- `warning`: "⚠️ Warning: Approaching budget limit"
- `danger`: "🚨 Danger: Budget exceeded by ₹X" or "Only ₹X remaining"

---

#### 4. CategoryBreakdownChart.tsx

**Purpose**: Simple bar chart showing expenses by category

**Props**:
```typescript
interface Props {
  categoryBreakdown: CategoryBreakdown[];
}
```

**UI Structure** (ASCII approximation):
```
┌───────────────────────────────────────────────┐
│  Spending by Category                         │
├───────────────────────────────────────────────┤
│                                               │
│  👷 Labour         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ₹15,000 (39%)│
│  🧪 Fertilizer     ▓▓▓▓▓▓▓▓▓▓▓  ₹12,200 (32%) │
│  🌱 Seeds          ▓▓▓▓▓▓▓      ₹8,000 (21%)  │
│  🐛 Pesticides     ▓▓           ₹2,500 (6%)   │
│  🚜 Equipment      ▓            ₹1,000 (3%)   │
│                                               │
│  Total: ₹38,700                               │
└───────────────────────────────────────────────┘
```

**Implementation**: 
- Use simple HTML/CSS bars (divs with width %), not complex charting library
- Sort by amount descending
- Show category icon, name, bar, amount, percentage
- Mobile-friendly: Stack vertically, bars horizontal

---

#### 5. BudgetAlertBanner.tsx

**Purpose**: Prominent warning when budget threshold breached

**Props**:
```typescript
interface Props {
  budgetStatus: BudgetStatus;
  onViewExpenses: () => void;
}
```

**UI Structure**:
```
┌───────────────────────────────────────────────────────┐
│ ⚠️ Budget Alert: 80% of budget used!                  │
│                                                        │
│ You've spent ₹38,700 of ₹50,000. Only ₹11,300       │
│ remaining for the season.                             │
│                                                        │
│ [View Expenses] [Dismiss]                             │
└───────────────────────────────────────────────────────┘
```

**Display Logic**:
- Show when `alertLevel === 'warning'` or `alertLevel === 'danger'`
- Appears at top of FarmingPlanDetailPage (above activities)
- Yellow background for warning, red for danger
- Dismiss stores in localStorage (don't show again for this plan until next alert)
- View Expenses button scrolls to expenses tab

---

### Integration with Phase 1

**How Expense Tracking Connects to Phase 1**:

1. **Plan Budget** (Read-Only):
   - Read `plan.totalBudget` from Phase 1 farmingPlans collection
   - Never modify Phase 1 plan document
   - Compare expenses vs this budget

2. **Activity Linking** (Optional):
   - When logging expense, can select Phase 1 activity from dropdown
   - Store `activityId` in expense document
   - Display in expense list: "Activity: Weeding"
   - Phase 1 activity unchanged - no backreference

3. **Budget Alerts** (Create Phase 1 Notifications):
   - When expense pushes budget to 80%+, create notification via Phase 1 API:
     ```javascript
     POST /api/farming-plans/notifications
     {
       planId,
       userId,
       type: 'budget_alert',
       priority: 'high',
       messageEnglish: 'Budget 80% used - ₹38,700 of ₹50,000 spent',
       messageTamil: 'பட்ஜெட்டில் 80% பயன்படுத்தப்பட்டது'
     }
     ```
   - Notification appears in Phase 1's NotificationPanel
   - Farmer clicks → navigates to expenses tab

4. **Activity Completion Prompt** (Phase 2.1 Enhancement):
   - When farmer marks Phase 1 activity complete
   - Show prompt: "Log actual cost? Estimated was ₹500"
   - Pre-fill ExpenseEntryModal with activity details
   - Optional - farmer can skip

---

## Feature 2: Labour Management

### Business Requirements

**Core Functionality**:
- Register workers (name, phone, wage, skills)
- Mark daily attendance (checkbox grid)
- Track work hours (half-day, full-day)
- Calculate payments due
- Mark payments as paid
- Send SMS reminders to workers

**Success Criteria**:
- Worker registered in <20 seconds
- Attendance marked for 10 workers in <30 seconds
- SMS sent within 2 minutes of marking attendance
- Payment calculations accurate (wage × days worked)

---

### Backend API Design

#### 2.1 Register Worker

**Endpoint**: `POST /api/labour/workers`

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "name": "Ravi Kumar",
  "phone": "+919876543210",
  "dailyWage": 600,
  "skills": ["weeding", "harvesting", "plowing"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "worker": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "507f1f77bcf86cd799439012",
    "name": "Ravi Kumar",
    "phone": "+919876543210",
    "dailyWage": 600,
    "skills": ["weeding", "harvesting", "plowing"],
    "isActive": true,
    "createdAt": "2026-01-30T11:00:00.000Z"
  }
}
```

**Validation**:
- Name: 2-50 chars
- Phone: Valid Indian mobile (+91XXXXXXXXXX or 10 digits)
- Wage: > 0, < 5000 (sanity check)
- Skills: Array of strings, max 10 skills

---

#### 2.2 List Workers

**Endpoint**: `GET /api/labour/workers/user/:userId`

**Query Parameters**:
- `isActive` (optional): `true` | `false` (default: true)

**Response** (200 OK):
```json
{
  "success": true,
  "workers": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Ravi Kumar",
      "phone": "+919876543210",
      "dailyWage": 600,
      "skills": ["weeding", "harvesting"],
      "isActive": true,
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
    // ... more workers
  ],
  "total": 8
}
```

---

#### 2.3 Mark Attendance

**Endpoint**: `POST /api/labour/attendance`

**Request Body**:
```json
{
  "planId": "507f1f77bcf86cd799439011",
  "activityId": "507f1f77bcf86cd799439013",  // optional - Phase 1 activity
  "date": "2026-01-30",
  "workers": [
    {
      "workerId": "507f1f77bcf86cd799439020",
      "hoursWorked": 8,
      "workType": "weeding",
      "notes": ""
    },
    {
      "workerId": "507f1f77bcf86cd799439021",
      "hoursWorked": 4,
      "workType": "weeding",
      "notes": "Left early due to rain"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "attendance": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "workerId": "507f1f77bcf86cd799439020",
      "planId": "507f1f77bcf86cd799439011",
      "activityId": "507f1f77bcf86cd799439013",
      "date": "2026-01-30",
      "hoursWorked": 8,
      "workType": "weeding",
      "isPaid": false,
      "paidAmount": 0,
      "createdAt": "2026-01-30T18:00:00.000Z"
    }
    // ... more attendance records
  ],
  "paymentSummary": [
    {
      "workerId": "507f1f77bcf86cd799439020",
      "workerName": "Ravi Kumar",
      "amountDue": 600,  // 8 hours = full day = ₹600
      "totalDaysWorked": 1
    },
    {
      "workerId": "507f1f77bcf86cd799439021",
      "workerName": "Lakshmi",
      "amountDue": 300,  // 4 hours = half day = ₹300
      "totalDaysWorked": 0.5
    }
  ]
}
```

**Backend Logic**:
1. Validate date (not future)
2. Check for duplicate attendance (same worker, same date, same plan)
3. Create attendance records (bulk insert)
4. Calculate payment amounts:
   - 8+ hours = full day = dailyWage
   - 4-7 hours = half day = dailyWage / 2
   - <4 hours = quarter day = dailyWage / 4
5. Return attendance + payment summary

---

#### 2.4 Get Pending Payments

**Endpoint**: `GET /api/labour/payments/pending/:userId`

**Response** (200 OK):
```json
{
  "success": true,
  "pendingPayments": [
    {
      "workerId": "507f1f77bcf86cd799439020",
      "workerName": "Ravi Kumar",
      "phone": "+919876543210",
      "totalDaysWorked": 5.5,
      "totalHours": 46,
      "amountDue": 3300,
      "lastWorkedDate": "2026-01-30",
      "attendanceRecords": [
        {
          "_id": "507f1f77bcf86cd799439030",
          "date": "2026-01-30",
          "hoursWorked": 8,
          "workType": "weeding",
          "planName": "Paddy Kharif 2026"
        }
        // ... more records
      ]
    }
    // ... more workers
  ],
  "totalAmountDue": 18500
}
```

**Backend Logic**:
1. Find all attendance records where `isPaid === false` and `userId` matches
2. Group by workerId
3. Sum hours, calculate days, calculate amount
4. Join with worker details (name, phone)
5. Sort by totalAmountDue descending

---

#### 2.5 Mark Payment as Paid

**Endpoint**: `POST /api/labour/payments`

**Request Body**:
```json
{
  "workerId": "507f1f77bcf86cd799439020",
  "attendanceIds": [
    "507f1f77bcf86cd799439030",
    "507f1f77bcf86cd799439031"
  ],  // specific attendance records being paid
  "amountPaid": 3300,
  "paymentMethod": "cash",
  "paymentDate": "2026-01-31",
  "notes": "Paid in full"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439040",
    "workerId": "507f1f77bcf86cd799439020",
    "attendanceIds": ["..."],
    "amountPaid": 3300,
    "paymentMethod": "cash",
    "paymentDate": "2026-01-31",
    "createdAt": "2026-01-31T10:00:00.000Z"
  },
  "expenseCreated": {  // Auto-create expense for this payment
    "_id": "507f1f77bcf86cd799439050",
    "planId": "507f1f77bcf86cd799439011",
    "category": "labour",
    "amount": 3300,
    "description": "Labour payment - Ravi Kumar (5.5 days)",
    "date": "2026-01-31"
  }
}
```

**Backend Logic**:
1. Validate workerId and attendanceIds exist
2. Update attendance records: `isPaid = true`, `paidAmount`, `paidDate`
3. **Auto-create expense** (call expense API internally):
   - Category: "labour"
   - Amount: amountPaid
   - Description: "Labour payment - {workerName} ({days} days)"
   - Date: paymentDate
   - Link to planId from attendance records
4. Return payment + auto-created expense

**Why Auto-Create Expense?**:
- Labour payments = major expense category
- Farmer shouldn't manually duplicate entry
- Ensures budget tracking includes all labour costs
- Can still see detailed attendance breakdown separately

---

#### 2.6 Send SMS Reminder

**Endpoint**: `POST /api/labour/sms-reminder`

**Request Body**:
```json
{
  "workerIds": ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"],
  "planId": "507f1f77bcf86cd799439011",
  "activityName": "Weeding",
  "scheduledDate": "2026-02-01",
  "message": "Work tomorrow (Feb 1) - Weeding at Murugan's farm. ₹600/day. Come by 7 AM."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "smsSent": 2,
  "smsFailed": 0,
  "details": [
    {
      "workerId": "507f1f77bcf86cd799439020",
      "phone": "+919876543210",
      "status": "sent",
      "messageId": "SM1234567890"
    },
    {
      "workerId": "507f1f77bcf86cd799439021",
      "phone": "+919876543211",
      "status": "sent",
      "messageId": "SM1234567891"
    }
  ]
}
```

**Backend Logic**:
1. Get worker phone numbers
2. Send SMS via Twilio API (or similar):
   ```javascript
   await twilioClient.messages.create({
     body: message,
     from: TWILIO_PHONE_NUMBER,
     to: workerPhone
   });
   ```
3. Handle failures gracefully (log, don't crash)
4. Return status for each worker

**SMS Template** (bilingual):
- English: "Work tomorrow ({date}) - {activity} at {farmerName}'s farm. ₹{wage}/day. Come by 7 AM."
- Tamil: "நாளை ({date}) - {farmerName} வயலில் {activity}. நாள் கூலி ₹{wage}. காலை 7 மணிக்கு வாருங்கள்."

---

### Database Schemas

#### Workers Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // farmer who added this worker
  name: String,               // worker's name
  phone: String,              // +919876543210 format
  dailyWage: Number,          // in rupees
  skills: [String],           // e.g., ["weeding", "harvesting", "plowing"]
  isActive: Boolean,          // true = still working, false = no longer available
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{
  "userId": 1,
  "isActive": 1
}
{
  "phone": 1  // for duplicate check
}
```

#### Attendance Collection

```javascript
{
  _id: ObjectId,
  workerId: ObjectId,
  planId: ObjectId,
  activityId: ObjectId,       // optional - Phase 1 activity
  date: Date,                 // work date (not createdAt)
  hoursWorked: Number,        // 4, 8, 10, etc.
  workType: String,           // weeding, harvesting, plowing, etc.
  isPaid: Boolean,            // false until payment made
  paidAmount: Number,         // 0 until paid
  paidDate: Date,             // null until paid
  paymentMethod: String,      // cash, upi, bank, etc.
  notes: String,              // optional
  createdAt: Date,
  updatedAt: Date,
  syncedAt: Date              // for offline sync
}

// Indexes
{
  "workerId": 1,
  "isPaid": 1
}
{
  "planId": 1,
  "date": -1
}
{
  "workerId": 1,
  "date": -1
}
```

---

### Frontend Service: labourService.ts

```typescript
// /src/services/labourService.ts

export interface Worker {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  dailyWage: number;
  skills: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  _id: string;
  workerId: string;
  planId: string;
  activityId?: string;
  date: string;
  hoursWorked: number;
  workType: string;
  isPaid: boolean;
  paidAmount: number;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface PendingPayment {
  workerId: string;
  workerName: string;
  phone: string;
  totalDaysWorked: number;
  totalHours: number;
  amountDue: number;
  lastWorkedDate: string;
  attendanceRecords: AttendanceRecord[];
}

// Register worker
export async function registerWorker(data: {
  userId: string;
  name: string;
  phone: string;
  dailyWage: number;
  skills: string[];
}): Promise<Worker> {
  const url = `${API_BASE_URL}/labour/workers`;
  const response = await offlineWrapper(
    () => fetch(url, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(data)
    }),
    {
      action: 'register_worker',
      collection: 'workers',
      data,
      fallback: () => saveOfflineWorker(data)
    }
  );
  return response.json();
}

// List workers
export async function getWorkers(userId: string, activeOnly = true): Promise<Worker[]> {
  const url = `${API_BASE_URL}/labour/workers/user/${userId}?isActive=${activeOnly}`;
  const response = await offlineWrapper(
    () => fetch(url, { headers: getApiHeaders() }),
    {
      action: 'fetch_workers',
      fallback: () => getOfflineWorkers(userId, activeOnly)
    }
  );
  return response.json();
}

// Mark attendance
export async function markAttendance(data: {
  planId: string;
  activityId?: string;
  date: string;
  workers: Array<{
    workerId: string;
    hoursWorked: number;
    workType: string;
    notes?: string;
  }>;
}): Promise<{ attendance: AttendanceRecord[]; paymentSummary: any[] }> {
  const url = `${API_BASE_URL}/labour/attendance`;
  const response = await offlineWrapper(
    () => fetch(url, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(data)
    }),
    {
      action: 'mark_attendance',
      collection: 'attendance',
      data,
      fallback: () => saveOfflineAttendance(data)
    }
  );
  return response.json();
}

// Get pending payments
export async function getPendingPayments(userId: string): Promise<{
  pendingPayments: PendingPayment[];
  totalAmountDue: number;
}> {
  const url = `${API_BASE_URL}/labour/payments/pending/${userId}`;
  const response = await offlineWrapper(
    () => fetch(url, { headers: getApiHeaders() }),
    {
      action: 'fetch_payments',
      fallback: () => getOfflinePendingPayments(userId)
    }
  );
  return response.json();
}

// Mark payment as paid
export async function markPaymentPaid(data: {
  workerId: string;
  attendanceIds: string[];
  amountPaid: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
}): Promise<{ payment: any; expenseCreated: Expense }> {
  const url = `${API_BASE_URL}/labour/payments`;
  const response = await offlineWrapper(
    () => fetch(url, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(data)
    }),
    {
      action: 'mark_payment',
      collection: 'payments',
      data,
      fallback: () => saveOfflinePayment(data)
    }
  );
  return response.json();
}

// Send SMS reminder (online only)
export async function sendSMSReminder(data: {
  workerIds: string[];
  planId: string;
  activityName: string;
  scheduledDate: string;
  message: string;
}): Promise<{ smsSent: number; smsFailed: number; details: any[] }> {
  const url = `${API_BASE_URL}/labour/sms-reminder`;
  
  if (!navigator.onLine) {
    throw new Error('SMS requires internet connection. Will retry when online.');
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(data)
  });
  return response.json();
}
```

---

### Frontend Components

#### 1. WorkerRegistry.tsx

**Purpose**: List of workers with add/edit/deactivate

**UI Structure**:
```
┌───────────────────────────────────────────────┐
│  Workers (8)                        [+ Add]   │
├───────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐│
│  │ Ravi Kumar            ₹600/day          ││
│  │ +919876543210                           ││
│  │ Skills: Weeding, Harvesting             ││
│  │                    [Edit] [Deactivate]  ││
│  └──────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────┐│
│  │ Lakshmi               ₹500/day          ││
│  │ +919876543211                           ││
│  │ Skills: Weeding                         ││
│  │                    [Edit] [Deactivate]  ││
│  └──────────────────────────────────────────┘│
│  ...                                          │
│  [Show Inactive Workers (2)]                  │
└───────────────────────────────────────────────┘
```

**Add Worker Modal**:
```
┌─────────────────────────────────────────┐
│  Add Worker                          [X]│
├─────────────────────────────────────────┤
│  Name *                                  │
│  [Ravi Kumar _______________]           │
│                                          │
│  Phone Number *                          │
│  [+91 9876543210 __________]            │
│                                          │
│  Daily Wage (₹) *                        │
│  [600 ____]                             │
│                                          │
│  Skills (select all that apply)          │
│  ☑ Weeding   ☐ Plowing                  │
│  ☑ Harvesting ☐ Sowing                  │
│  ☐ Spraying   ☐ Other                   │
│                                          │
│  [Cancel]              [Add Worker]     │
└─────────────────────────────────────────┘
```

---

#### 2. AttendanceMarker.tsx

**Purpose**: Quick attendance marking for multiple workers

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│  Mark Attendance - Jan 30, 2026                  │
├───────────────────────────────────────────────────┤
│  Plan: [v Paddy Kharif 2026  ]                   │
│  Activity: [v Weeding         ] (optional)        │
│                                                   │
│  Select Workers:                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ ☑ Ravi Kumar        Hours: [8v] Full day  │  │
│  │   Work: [Weeding v]                        │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │ ☑ Lakshmi           Hours: [4v] Half day  │  │
│  │   Work: [Weeding v]                        │  │
│  │   Note: [Left early - rain__________]      │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │ ☐ Kumar             Hours: [8v] Full day  │  │
│  │   (not selected)                           │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
│  Payment Summary:                                 │
│  2 workers × avg 6 hours = ₹900 due              │
│                                                   │
│  ☐ Send SMS reminder for tomorrow's work          │
│                                                   │
│  [Cancel]                  [Mark Attendance]     │
└───────────────────────────────────────────────────┘
```

**Key Features**:
- Select multiple workers with checkboxes
- Hours dropdown: 2, 4, 6, 8, 10, 12 (or manual entry)
- Auto-calculate: 8+ = full day, 4-7 = half day, <4 = quarter day
- Work type dropdown: Weeding, Harvesting, Plowing, Sowing, Spraying, Other
- Optional notes per worker
- Payment summary updates live as selections change
- SMS checkbox (sends reminder for next day's work)

---

#### 3. PaymentTracker.tsx

**Purpose**: List pending payments with "Mark Paid" action

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│  Pending Payments                                 │
│  Total Due: ₹18,500 (3 workers)                  │
├───────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐  │
│  │ Ravi Kumar                                  │  │
│  │ 5.5 days worked (46 hours)                  │  │
│  │ Amount Due: ₹3,300                          │  │
│  │ Last Worked: Jan 30, 2026                   │  │
│  │                                             │  │
│  │ Recent Work:                                │  │
│  │ • Jan 30: Weeding (8 hrs)                  │  │
│  │ • Jan 28: Harvesting (8 hrs)               │  │
│  │ • Jan 26: Weeding (8 hrs)                  │  │
│  │ ...and 3 more                              │  │
│  │                                             │  │
│  │ [Mark as Paid]        [View Full History]  │  │
│  └────────────────────────────────────────────┘  │
│  ...more workers                                  │
└───────────────────────────────────────────────────┘
```

**Mark as Paid Modal**:
```
┌─────────────────────────────────────────┐
│  Record Payment - Ravi Kumar         [X]│
├─────────────────────────────────────────┤
│  Amount Due: ₹3,300 (5.5 days)          │
│                                          │
│  Amount Paid (₹) *                       │
│  [3300 ____]  (edit if partial payment) │
│                                          │
│  Payment Method *                        │
│  ● Cash   ○ UPI   ○ Bank Transfer        │
│                                          │
│  Payment Date *                          │
│  [Jan 31, 2026 📅]                      │
│                                          │
│  Notes (optional)                        │
│  [Paid in full ______________]          │
│                                          │
│  ℹ️ This will also create an expense    │
│     entry for ₹3,300 (Labour category)  │
│                                          │
│  [Cancel]              [Mark as Paid]   │
└─────────────────────────────────────────┘
```

**Post-Payment**:
- Attendance records updated: isPaid = true
- Expense auto-created (visible in expense tracker)
- Worker removed from pending list
- Success toast: "Payment recorded! Expense added to budget tracking."

---

#### 4. WorkerDetailCard.tsx

**Purpose**: Full payment history for one worker

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│  Ravi Kumar - Payment History                     │
├───────────────────────────────────────────────────┤
│  Phone: +919876543210                             │
│  Daily Wage: ₹600                                 │
│  Total Paid This Season: ₹12,000 (20 days)       │
│  Pending: ₹3,300 (5.5 days)                      │
├───────────────────────────────────────────────────┤
│  Recent Payments:                                 │
│  ┌────────────────────────────────────────────┐  │
│  │ Jan 25, 2026 - ₹4,800 (Cash)              │  │
│  │ 8 days: Jan 14-21 (Weeding, Harvesting)   │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │ Jan 10, 2026 - ₹3,600 (UPI)               │  │
│  │ 6 days: Jan 4-9 (Plowing, Sowing)         │  │
│  └────────────────────────────────────────────┘  │
│  ...                                              │
├───────────────────────────────────────────────────┤
│  Unpaid Work:                                     │
│  • Jan 30: Weeding (8 hrs) - ₹600                │
│  • Jan 28: Harvesting (8 hrs) - ₹600             │
│  • Jan 26: Weeding (8 hrs) - ₹600                │
│  • Jan 24: Weeding (8 hrs) - ₹600                │
│  • Jan 22: Weeding (4 hrs) - ₹300                │
│                                                   │
│  [Mark as Paid - ₹3,300]                         │
└───────────────────────────────────────────────────┘
```

---

#### 5. SMSReminderModal.tsx

**Purpose**: Send SMS to selected workers for next day's work

**UI Structure**:
```
┌─────────────────────────────────────────┐
│  Send SMS Reminder                   [X]│
├─────────────────────────────────────────┤
│  Select Workers:                         │
│  ☑ Ravi Kumar (+919876543210)           │
│  ☑ Lakshmi (+919876543211)              │
│  ☐ Kumar (+919876543212)                │
│                                          │
│  Work Details:                           │
│  Activity: [Weeding v]                  │
│  Date: [Feb 1, 2026 📅]                 │
│  Time: [7:00 AM v]                      │
│                                          │
│  Message Preview:                        │
│  ┌──────────────────────────────────┐   │
│  │ Work tomorrow (Feb 1) - Weeding   │   │
│  │ at Murugan's farm. ₹600/day.      │   │
│  │ Come by 7 AM.                     │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Language: ● English  ○ Tamil            │
│                                          │
│  ℹ️ SMS cost: ₹0.40 (2 workers)         │
│                                          │
│  [Cancel]              [Send SMS]       │
└─────────────────────────────────────────┘
```

**Post-Send**:
- Show status: "SMS sent to 2 workers ✓"
- If failures: "SMS sent to 1/2. Ravi Kumar failed (invalid number)."
- Store in activity log (for debugging)

---

### Integration with Phase 1

**How Labour Management Connects to Phase 1**:

1. **Activity Linking** (Optional):
   - When marking attendance, can select Phase 1 activity
   - Store `activityId` in attendance record
   - Display in attendance list: "Activity: Weeding"
   - Phase 1 activity unchanged

2. **Payment → Expense Auto-Creation** (Critical):
   - When farmer marks payment as paid, auto-create expense:
     ```javascript
     POST /api/expenses  // Phase 2 expense API
     {
       planId: (from attendance records),
       userId: (current user),
       category: 'labour',
       amount: amountPaid,
       description: `Labour payment - ${workerName} (${days} days)`,
       date: paymentDate,
       notes: `Attendance: ${date1}, ${date2}, ${date3}...`
     }
     ```
   - This ensures labour costs appear in budget tracking
   - Farmer sees expense in ExpenseList.tsx
   - Budget progress bar updates automatically

3. **Activity Completion → Attendance Prompt** (Future Enhancement - Phase 2.1):
   - When farmer marks Phase 1 activity complete
   - Show prompt: "Mark worker attendance for this activity?"
   - Pre-fill AttendanceMarker with activity details
   - Optional - farmer can skip

---

## Feature 3: Offline-First Sync

### Business Requirements

**Core Functionality**:
- All actions work offline (expense log, attendance mark, etc.)
- Actions queued for sync when connection restored
- Visual indicator showing offline status + pending actions
- Auto-sync when connection detected
- Simple conflict resolution (last-write-wins)

**Success Criteria**:
- 100% of expense/attendance actions work offline
- Sync completes within 30 seconds for <50 pending actions
- <1% data loss (only extreme cases like app data cleared)
- User understands offline state (clear indicator)

---

### Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend Application                 │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  offlineWrapper(apiCall, config)     │  │
│  │  - Checks navigator.onLine            │  │
│  │  - If online: execute API call        │  │
│  │  - If offline: fallback + queue       │  │
│  └──────────────────────────────────────┘  │
│         │                     │              │
│         ▼                     ▼              │
│  ┌──────────┐        ┌───────────────────┐ │
│  │ IndexedDB│        │  Sync Queue       │ │
│  │ (cache)  │        │  (pending actions)│ │
│  └──────────┘        └───────────────────┘ │
│                                              │
└─────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
  (offline data)            (when online)
         │                          │
         │                          ▼
         │                 ┌────────────────┐
         │                 │ POST /api/sync │
         │                 │ /push (batch)  │
         │                 └────────────────┘
         │                          │
         │                          ▼
         │                 ┌────────────────┐
         │                 │  Backend       │
         │                 │  - Process all │
         │                 │  - Return IDs  │
         │                 └────────────────┘
         │                          │
         │                          ▼
         └────────────────(update cache with server IDs)
```

---

### Backend API Design

#### 3.1 Batch Sync Push

**Endpoint**: `POST /api/sync/push`

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "actions": [
    {
      "tempId": "temp_1706700000001",
      "action": "create_expense",
      "collection": "expenses",
      "data": {
        "planId": "507f1f77bcf86cd799439011",
        "userId": "507f1f77bcf86cd799439012",
        "category": "fertilizer",
        "amount": 1200,
        "date": "2026-01-30T10:30:00.000Z",
        "description": "Urea 50kg bag",
        "notes": ""
      },
      "timestamp": "2026-01-30T10:35:00.000Z"
    },
    {
      "tempId": "temp_1706700000002",
      "action": "mark_attendance",
      "collection": "attendance",
      "data": {
        "planId": "507f1f77bcf86cd799439011",
        "date": "2026-01-30",
        "workers": [
          {
            "workerId": "507f1f77bcf86cd799439020",
            "hoursWorked": 8,
            "workType": "weeding"
          }
        ]
      },
      "timestamp": "2026-01-30T18:00:00.000Z"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "processed": 2,
  "failed": 0,
  "results": [
    {
      "tempId": "temp_1706700000001",
      "status": "success",
      "serverId": "507f1f77bcf86cd799439014",
      "collection": "expenses"
    },
    {
      "tempId": "temp_1706700000002",
      "status": "success",
      "serverId": "507f1f77bcf86cd799439030",
      "collection": "attendance"
    }
  ],
  "conflicts": [],
  "timestamp": "2026-01-31T10:00:00.000Z"
}
```

**Error Response** (207 Multi-Status):
```json
{
  "success": false,
  "processed": 1,
  "failed": 1,
  "results": [
    {
      "tempId": "temp_1706700000001",
      "status": "success",
      "serverId": "507f1f77bcf86cd799439014"
    },
    {
      "tempId": "temp_1706700000002",
      "status": "failed",
      "error": "Duplicate attendance for same worker/date/plan"
    }
  ]
}
```

**Backend Logic**:
1. Validate userId matches session
2. Sort actions by timestamp (process in order)
3. For each action:
   - Route to appropriate service (expenses, attendance, etc.)
   - Execute operation (create, update, delete)
   - Catch errors (duplicate, validation, etc.)
   - Store result (success + serverId OR failed + error)
4. Return batch results

**Conflict Detection** (Simple - Last-Write-Wins):
- Check if record already exists (by tempId mapping or business key)
- If exists and `syncedAt` < action.timestamp: update (newer wins)
- If exists and `syncedAt` >= action.timestamp: skip (older, already synced)
- No complex 3-way merge (Phase 2.0 constraint)

---

#### 3.2 Fetch Updates

**Endpoint**: `GET /api/sync/pull/:userId?lastSync=timestamp`

**Query Parameters**:
- `lastSync` (required): ISO 8601 timestamp of last successful sync

**Response** (200 OK):
```json
{
  "success": true,
  "updates": {
    "expenses": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "planId": "507f1f77bcf86cd799439011",
        "category": "fertilizer",
        "amount": 1200,
        "date": "2026-01-30T10:30:00.000Z",
        "updatedAt": "2026-01-30T10:35:22.000Z"
      }
    ],
    "attendance": [],
    "workers": [],
    "plans": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "cropName": "Paddy",
        "totalBudget": 50000,
        "updatedAt": "2026-01-30T10:40:00.000Z"
      }
    ]
  },
  "deletions": {
    "expenses": ["507f1f77bcf86cd799439015"],  // IDs of deleted records
    "attendance": []
  },
  "timestamp": "2026-01-31T10:00:00.000Z"
}
```

**Backend Logic**:
1. Find all records for userId where `updatedAt > lastSync`
2. Group by collection (expenses, attendance, workers, plans)
3. Find all records where `deletedAt > lastSync` (soft deletes)
4. Return updates + deletions

**Use Case**:
- Farmer uses app on mobile (offline), logs 5 expenses
- Farmer opens app on web (online), fetches updates
- Web app merges offline changes from backend

---

### Frontend: Offline Service Layer

#### offlineWrapper.ts

```typescript
// /src/services/offlineWrapper.ts

interface OfflineConfig {
  action: string;               // 'create_expense', 'mark_attendance', etc.
  collection?: string;          // 'expenses', 'attendance', etc.
  data?: any;                   // payload for sync
  fallback?: () => any;         // function to execute offline
}

interface QueuedAction {
  tempId: string;
  action: string;
  collection: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}

export async function offlineWrapper<T>(
  apiCall: () => Promise<Response>,
  config: OfflineConfig
): Promise<T> {
  // Check if online
  if (navigator.onLine) {
    try {
      const response = await apiCall();
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      // Network error (offline suddenly)
      console.error('API call failed, falling back to offline:', error);
      return handleOffline(config);
    }
  } else {
    // Offline mode
    return handleOffline(config);
  }
}

function handleOffline(config: OfflineConfig): any {
  // Execute fallback (return optimistic response)
  const result = config.fallback ? config.fallback() : null;
  
  // Queue action for sync (if write operation)
  if (config.action && config.collection && config.data) {
    queueAction({
      tempId: `temp_${Date.now()}_${Math.random()}`,
      action: config.action,
      collection: config.collection,
      data: config.data,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    });
  }
  
  // Show offline indicator
  notifyOffline();
  
  return result;
}

// Queue action in IndexedDB
async function queueAction(action: QueuedAction): Promise<void> {
  const db = await openDB('farmees_offline', 1, {
    upgrade(db) {
      db.createObjectStore('syncQueue', { keyPath: 'tempId' });
    }
  });
  
  await db.put('syncQueue', action);
}

// Get all pending actions
export async function getPendingActions(): Promise<QueuedAction[]> {
  const db = await openDB('farmees_offline', 1);
  const actions = await db.getAll('syncQueue');
  return actions.filter(a => a.status === 'pending');
}

// Sync all pending actions
export async function syncPendingActions(userId: string): Promise<{
  success: number;
  failed: number;
}> {
  const pending = await getPendingActions();
  
  if (pending.length === 0) {
    return { success: 0, failed: 0 };
  }
  
  // Call batch sync API
  const response = await fetch(`${API_BASE_URL}/sync/push`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ userId, actions: pending })
  });
  
  const result = await response.json();
  
  // Update queue with results
  const db = await openDB('farmees_offline', 1);
  let successCount = 0;
  let failedCount = 0;
  
  for (const r of result.results) {
    if (r.status === 'success') {
      // Remove from queue (synced)
      await db.delete('syncQueue', r.tempId);
      
      // Update local cache with server ID
      await updateCacheWithServerId(r.tempId, r.serverId, r.collection);
      
      successCount++;
    } else {
      // Mark as failed, increment retry count
      const action = await db.get('syncQueue', r.tempId);
      action.status = 'failed';
      action.error = r.error;
      action.retryCount++;
      await db.put('syncQueue', action);
      
      failedCount++;
    }
  }
  
  return { success: successCount, failed: failedCount };
}

// Update cache with server-assigned IDs
async function updateCacheWithServerId(
  tempId: string,
  serverId: string,
  collection: string
): Promise<void> {
  const db = await openDB('farmees_offline', 1);
  
  // Find cached record with tempId
  const store = db.transaction(collection, 'readwrite').objectStore(collection);
  const records = await store.getAll();
  const record = records.find(r => r._id === tempId);
  
  if (record) {
    // Update _id to server ID
    await store.delete(tempId);
    record._id = serverId;
    await store.put(record);
  }
}

// Listen for online event
window.addEventListener('online', async () => {
  console.log('Connection restored, syncing...');
  const userId = getCurrentUserId();  // from AuthContext
  const result = await syncPendingActions(userId);
  
  if (result.success > 0) {
    showToast(`Synced ${result.success} actions successfully!`);
  }
  if (result.failed > 0) {
    showToast(`${result.failed} actions failed to sync. Will retry later.`, 'error');
  }
});
```

---

### Frontend: Storage Manager

#### storageManager.ts

```typescript
// /src/services/storageManager.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FarmeesDB extends DBSchema {
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'by-plan': string; 'by-date': string };
  };
  workers: {
    key: string;
    value: Worker;
    indexes: { 'by-user': string };
  };
  attendance: {
    key: string;
    value: AttendanceRecord;
    indexes: { 'by-worker': string; 'by-plan': string };
  };
  plans: {
    key: string;
    value: FarmingPlan;
    indexes: { 'by-user': string };
  };
  syncQueue: {
    key: string;
    value: QueuedAction;
  };
}

let dbPromise: Promise<IDBPDatabase<FarmeesDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<FarmeesDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FarmeesDB>('farmees_offline', 2, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: '_id' });
          expenseStore.createIndex('by-plan', 'planId');
          expenseStore.createIndex('by-date', 'date');
        }
        
        if (!db.objectStoreNames.contains('workers')) {
          const workerStore = db.createObjectStore('workers', { keyPath: '_id' });
          workerStore.createIndex('by-user', 'userId');
        }
        
        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: '_id' });
          attendanceStore.createIndex('by-worker', 'workerId');
          attendanceStore.createIndex('by-plan', 'planId');
        }
        
        if (!db.objectStoreNames.contains('plans')) {
          const planStore = db.createObjectStore('plans', { keyPath: '_id' });
          planStore.createIndex('by-user', 'userId');
        }
        
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'tempId' });
        }
      }
    });
  }
  
  return dbPromise;
}

// Cache helpers

export async function cacheExpenses(expenses: Expense[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('expenses', 'readwrite');
  for (const expense of expenses) {
    await tx.store.put(expense);
  }
  await tx.done;
}

export async function getOfflineExpenses(
  planId: string,
  filters?: { category?: string; startDate?: string; endDate?: string }
): Promise<{ expenses: Expense[]; total: number }> {
  const db = await getDB();
  let expenses = await db.getAllFromIndex('expenses', 'by-plan', planId);
  
  // Apply filters
  if (filters?.category) {
    expenses = expenses.filter(e => e.category === filters.category);
  }
  if (filters?.startDate) {
    expenses = expenses.filter(e => new Date(e.date) >= new Date(filters.startDate!));
  }
  if (filters?.endDate) {
    expenses = expenses.filter(e => new Date(e.date) <= new Date(filters.endDate!));
  }
  
  // Sort by date descending
  expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return { expenses, total: expenses.length };
}

export async function calculateOfflineBudgetStatus(planId: string): Promise<BudgetStatus> {
  const db = await getDB();
  const expenses = await db.getAllFromIndex('expenses', 'by-plan', planId);
  const plan = await db.get('plans', planId);
  
  if (!plan) {
    throw new Error('Plan not found in cache');
  }
  
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = plan.totalBudget - totalSpent;
  const percentageUsed = (totalSpent / plan.totalBudget) * 100;
  
  // Category breakdown
  const categoryMap = new Map<string, number>();
  expenses.forEach(e => {
    const current = categoryMap.get(e.category) || 0;
    categoryMap.set(e.category, current + e.amount);
  });
  
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount,
    percentage: (amount / totalSpent) * 100
  }));
  
  // Alert level
  let alertLevel: 'ok' | 'warning' | 'danger' = 'ok';
  if (percentageUsed >= 90) alertLevel = 'danger';
  else if (percentageUsed >= 70) alertLevel = 'warning';
  
  return {
    totalBudget: plan.totalBudget,
    totalSpent,
    remaining,
    percentageUsed,
    categoryBreakdown,
    alertLevel,
    lastExpenseDate: expenses[0]?.date
  };
}

// Similar helpers for workers, attendance, etc.
export async function cacheWorkers(workers: Worker[]): Promise<void> { /* ... */ }
export async function getOfflineWorkers(userId: string, activeOnly: boolean): Promise<Worker[]> { /* ... */ }
export async function saveOfflineExpense(data: CreateExpenseRequest): Promise<Expense> { /* ... */ }
export async function saveOfflineWorker(data: any): Promise<Worker> { /* ... */ }
export async function saveOfflineAttendance(data: any): Promise<AttendanceRecord[]> { /* ... */ }
```

---

### Frontend Components

#### 1. OfflineIndicator.tsx

**Purpose**: Banner showing offline status + pending sync count

**UI Structure** (Online):
```
(no banner - clean UI)
```

**UI Structure** (Offline):
```
┌───────────────────────────────────────────────────┐
│ 📶 Working Offline - 5 actions pending sync       │
│ Changes will be saved when you're back online.    │
└───────────────────────────────────────────────────┘
```

**UI Structure** (Syncing):
```
┌───────────────────────────────────────────────────┐
│ ↻ Syncing... 3 of 5 done                          │
└───────────────────────────────────────────────────┘
```

**UI Structure** (Sync Complete):
```
┌───────────────────────────────────────────────────┐
│ ✓ All data synced! (dismiss in 5 seconds)         │
└───────────────────────────────────────────────────┘
```

**Implementation**:
```typescript
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  
  useEffect(() => {
    const updateStatus = async () => {
      const pending = await getPendingActions();
      setPendingCount(pending.length);
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 5000);  // check every 5s
    
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);
  
  if (isOnline && pendingCount === 0) return null;  // clean UI when all good
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 text-yellow-900 px-4 py-2 text-center">
      {!isOnline && (
        <>
          <span className="mr-2">📶</span>
          Working Offline - {pendingCount} actions pending sync
        </>
      )}
      {isOnline && pendingCount > 0 && !syncing && (
        <>
          <span className="mr-2">⚠️</span>
          {pendingCount} actions pending - <button onClick={handleManualSync} className="underline">Sync Now</button>
        </>
      )}
      {syncing && (
        <>
          <span className="mr-2">↻</span>
          Syncing... please wait
        </>
      )}
    </div>
  );
}
```

---

#### 2. SyncQueue.tsx

**Purpose**: List of pending actions (debug/transparency)

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│  Pending Sync (5 actions)                         │
├───────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐  │
│  │ Expense: ₹1,200 for Fertilizer             │  │
│  │ Jan 30, 10:35 AM                            │  │
│  │ Status: Pending                             │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │ Attendance: Ravi Kumar (8 hrs)             │  │
│  │ Jan 30, 6:00 PM                             │  │
│  │ Status: Pending                             │  │
│  └────────────────────────────────────────────┘  │
│  ...                                              │
│                                                   │
│  [Sync All Now]        [Clear Failed]            │
└───────────────────────────────────────────────────┘
```

**When to Show**:
- Settings page or debug menu
- Not main UI (reduces clutter)
- Useful for troubleshooting sync issues

---

#### 3. SyncStatus.tsx

**Purpose**: Last sync timestamp + manual sync button

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│  Sync Status                                      │
├───────────────────────────────────────────────────┤
│  Last synced: 2 hours ago                         │
│  All data up to date ✓                            │
│                                                   │
│  [Sync Now]                                       │
└───────────────────────────────────────────────────┘
```

**Placement**: Settings page or profile dropdown

---

### Offline Behavior Summary

| Action | Online Behavior | Offline Behavior | Sync Behavior |
|--------|----------------|------------------|---------------|
| **Log Expense** | POST /api/expenses → instant save | Save to IndexedDB → queue for sync → show success toast | Batch sync → update with server ID → show in expense list |
| **Mark Attendance** | POST /api/labour/attendance → instant save | Save to IndexedDB → queue → calculate payment offline | Batch sync → update IDs → payment calculations remain |
| **Register Worker** | POST /api/labour/workers → instant save | Save to IndexedDB → queue | Batch sync → update ID → worker available |
| **Mark Payment** | POST /api/labour/payments → create expense | Save payment + expense to IndexedDB → queue both | Sync payment first, then expense (order matters) |
| **View Expenses** | GET /api/expenses → fetch from DB | Load from IndexedDB cache | N/A (read-only) |
| **View Budget** | GET /api/expenses/budget-status → calculate server-side | Calculate from IndexedDB expenses + cached plan | N/A (calculated client-side) |
| **Send SMS** | POST /api/labour/sms-reminder → send immediately | Queue with error: "SMS requires internet" → retry on connect | Send when online, show status |
| **Export CSV** | GET /api/expenses/export → download | Error: "Export requires internet" → queue for later | Download when online |

---

## Week-by-Week Execution Plan

### Week 1-2: Expense Tracking (Backend + Frontend)

**Week 1: Backend Foundation**
- Day 1-2: Database schema setup
  - Create `expenses` collection with indexes
  - Create Mongoose model with validation
  - Write schema migration script
- Day 3-5: API endpoints
  - `POST /api/expenses` (create)
  - `GET /api/expenses/plan/:planId` (list with filters)
  - `GET /api/expenses/budget-status/:planId` (calculations)
  - `PUT /api/expenses/:id` (update)
  - `DELETE /api/expenses/:id` (soft delete)
- Day 6-7: Budget alert logic + Phase 1 notification integration
  - Calculate budget threshold (80%)
  - Create Phase 1 notification via existing API
  - Test alert triggering

**Week 2: Frontend Components**
- Day 1-2: Service layer
  - `expenseService.ts` with all API wrappers
  - TypeScript interfaces
  - Error handling
- Day 3-4: Core components
  - `ExpenseEntryModal.tsx` (add/edit form)
  - `ExpenseList.tsx` (list with filters)
- Day 5-6: Visualization + alerts
  - `BudgetProgressBar.tsx` (visual indicator)
  - `CategoryBreakdownChart.tsx` (simple bars)
  - `BudgetAlertBanner.tsx` (warning banner)
- Day 7: Integration + testing
  - Add expense tab to `FarmingPlanDetailPage.tsx`
  - Link to Phase 1 activities (optional activityId)
  - Budget stats on plan list page
  - Test create/edit/delete flows

**Deliverable**: Working expense tracker (online only, offline next week)

---

### Week 3-4: Labour Management (Backend + Frontend)

**Week 3: Backend Foundation**
- Day 1-2: Database schemas
  - `workers` collection + indexes
  - `attendance` collection + indexes
  - Mongoose models
- Day 3-5: Worker & attendance APIs
  - `POST /api/labour/workers` (register)
  - `GET /api/labour/workers/user/:userId` (list)
  - `POST /api/labour/attendance` (mark)
  - `GET /api/labour/payments/pending/:userId` (calculate due)
- Day 6-7: Payment API + expense integration
  - `POST /api/labour/payments` (mark paid)
  - Auto-create expense (call expense API internally)
  - SMS service setup (Twilio integration)
  - `POST /api/labour/sms-reminder` (send)

**Week 4: Frontend Components**
- Day 1-2: Service layer + worker registry
  - `labourService.ts` with all wrappers
  - `WorkerRegistry.tsx` (list + add/edit)
- Day 3-4: Attendance marking
  - `AttendanceMarker.tsx` (checkbox grid)
  - Payment calculation logic (hours → wage)
- Day 5-6: Payment tracking
  - `PaymentTracker.tsx` (pending list)
  - `WorkerDetailCard.tsx` (full history)
  - Mark paid flow with expense auto-creation
- Day 7: SMS + integration
  - `SMSReminderModal.tsx` (send reminders)
  - Add labour tab to `FarmingPlanDetailPage.tsx`
  - Test full workflow: register → attend → pay → expense created

**Deliverable**: Working labour management (online only)

---

### Week 5-6: Offline-First Sync (Infrastructure + Integration)

**Week 5: Backend Sync API**
- Day 1-2: Sync endpoints
  - `POST /api/sync/push` (batch upload)
  - `GET /api/sync/pull/:userId` (fetch updates)
  - `syncQueue` collection for tracking
- Day 3-5: Conflict resolution logic
  - Last-write-wins implementation
  - Timestamp comparison
  - Duplicate detection (same worker/date/plan)
  - Error handling for failed sync
- Day 6-7: Testing sync scenarios
  - Offline → log 10 expenses → online → sync
  - Concurrent edit (mobile + web) → last-write-wins
  - Partial failures (5 success, 2 fail) → retry

**Week 6: Frontend Offline Layer**
- Day 1-2: Storage manager
  - IndexedDB setup with `idb` library
  - `storageManager.ts` with cache helpers
  - Cache expenses, workers, attendance, plans
- Day 3-4: Offline wrapper
  - `offlineWrapper.ts` core logic
  - Queue pending actions
  - Navigator.onLine detection
  - Auto-sync on connection restore
- Day 5-6: UI components
  - `OfflineIndicator.tsx` (banner)
  - `SyncQueue.tsx` (pending list)
  - `SyncStatus.tsx` (last sync time)
  - Manual sync button
- Day 7: Integration + testing
  - Wrap all expense/labour API calls with offlineWrapper
  - Test offline create/edit/delete
  - Test sync completion (update with server IDs)
  - Test conflict scenarios

**Deliverable**: Fully offline-capable expense + labour tracking

---

### Week 7-8: Integration, Polish & Testing

**Week 7: Polish**
- Day 1-2: UI/UX improvements
  - Loading states (spinners during API calls)
  - Empty states ("No expenses yet...")
  - Error messages (user-friendly, bilingual)
  - Success toasts ("Expense added!", "Payment recorded!")
- Day 3-4: Performance optimization
  - IndexedDB query optimization
  - Pagination for large expense lists
  - Debounce category filters
  - Cache budget calculations (1 hour TTL)
- Day 5: CSV export
  - `GET /api/expenses/export/:planId?format=csv`
  - Frontend download link
  - Test with 100+ expenses
- Day 6-7: Bilingual refinement
  - All Tamil translations complete
  - Category names, alert messages, toasts
  - Number formatting (₹1,20,000 vs ₹120,000)

**Week 8: Testing & Documentation**
- Day 1-2: End-to-end testing
  - Create plan → generate activities → log expenses → track budget
  - Register workers → mark attendance → pay → expense auto-created
  - Offline → log 20 actions → online → sync → verify
- Day 3-4: User acceptance testing (if possible)
  - Test with 3-5 farmers (real devices, rural connectivity)
  - Collect feedback on UX, speed, understandability
  - Fix critical bugs
- Day 5-6: Documentation
  - API reference for Phase 2.0 endpoints
  - Frontend component tree with props
  - Offline sync flow diagram
  - Troubleshooting guide (sync fails, duplicate errors)
- Day 7: Deployment preparation
  - Environment variables (API URLs, SMS credentials)
  - Database indexes verified
  - Monitoring setup (error logging, sync metrics)
  - Rollback plan

**Deliverable**: Production-ready Phase 2.0 (expense, labour, offline)

---

## Assumptions & Fallback Behavior

### Critical Assumptions

#### 1. Farmers Have Smartphones
**Assumption**: Target users have Android smartphones (₹5,000-15,000 range) with 4G connectivity  
**Validation**: Survey 20 farmers - check device types, OS versions  
**Fallback**: If feature phones common (30%+), add SMS-based expense logging:
  - Farmer sends SMS: "EXP 500 FERTILIZER" → backend parses and creates expense
  - Reply: "Expense ₹500 added. Budget 65% used."

#### 2. Farmers Log Expenses Regularly
**Assumption**: Farmers will log expenses within 1-2 days (not bulk at end)  
**Validation**: Track logging patterns in first month - avg days between expense and log  
**Fallback**: If avg > 7 days, add "Bulk Import" feature:
  - Upload CSV from notebook
  - Photo of handwritten expense log → OCR (Phase 2.2)

#### 3. Workers Have Mobile Phones for SMS
**Assumption**: 80%+ daily wage workers have basic phones (2G capable)  
**Validation**: Ask farmers during worker registration if phone number valid  
**Fallback**: 
  - Mark worker as "No phone" → show warning
  - Farmer can print attendance sheet as backup
  - Offer voice call option (₹0.50/min) for workers without SMS

#### 4. IndexedDB Reliable for Offline Storage
**Assumption**: Modern browsers (Chrome, Safari) support IndexedDB, data persists across sessions  
**Validation**: Test on 10 devices (Android 8-14, iOS 14-17)  
**Fallback**: If IndexedDB quota exceeded (storage full):
  - Warn user: "Storage full - clear old data?"
  - Auto-delete synced actions older than 30 days
  - Offer "Sync & Clear" button

#### 5. Last-Write-Wins Sufficient for Conflicts
**Assumption**: Single-user scenarios (farmer uses one device) → conflicts rare  
**Validation**: Monitor conflict rate in first month (expect <1% of syncs)  
**Fallback**: If conflicts > 5%:
  - Phase 2.1: Add manual conflict resolution UI
  - Show both versions, let farmer choose
  - Log conflicts for analysis

#### 6. SMS Gateway 99%+ Reliable
**Assumption**: Twilio India has high delivery rates, low latency (<1 min)  
**Validation**: Monitor SMS delivery status via Twilio webhooks  
**Fallback**: If failure rate > 5%:
  - Integrate backup gateway (MSG91)
  - Auto-retry failed SMS after 10 min
  - Show farmer: "SMS failed for Ravi Kumar - call instead?"

---

### Offline Scenarios & Fallback Behavior

#### Scenario 1: Farmer Logs Expense Offline

**Flow**:
1. Farmer clicks "Add Expense" → form opens
2. Fills: ₹500, Labour, Weeding, Jan 30
3. Clicks "Add" → offlineWrapper detects offline
4. Expense saved to IndexedDB with tempId: `temp_1706700000001`
5. Action queued for sync
6. UI shows: "Expense added! Will sync when online." (green toast)
7. Expense appears in list immediately (using tempId)

**Farmer goes online**:
1. Auto-detect: `window.addEventListener('online')`
2. Sync triggers: `POST /api/sync/push` with queued actions
3. Backend processes: Creates expense, returns serverId
4. Frontend updates cache: Replace `temp_1706700000001` with `507f...`
5. UI shows: "Synced 1 expense successfully!" (toast)

**If sync fails** (e.g., duplicate):
1. Backend returns: `{ status: 'failed', error: 'Duplicate expense' }`
2. Frontend keeps in queue, increments retryCount
3. UI shows: "1 expense failed to sync. Will retry." (yellow toast)
4. Manual sync button available in settings

---

#### Scenario 2: Concurrent Edit (Farmer Uses Mobile + Web)

**Flow**:
1. Farmer logs expense on mobile (offline): ₹500, Labour, Jan 30, 10:00 AM
   - Saved to mobile IndexedDB: `temp_mobile_001`, syncedAt: null
2. Farmer logs same expense on web (online): ₹500, Labour, Jan 30, 10:05 AM
   - Saved to backend: serverId `507f...`, syncedAt: Jan 30 10:05
3. Mobile comes online, syncs: `POST /api/sync/push`
4. Backend checks: Expense exists with same planId/date/amount/category
5. Backend compares timestamps:
   - Mobile: Jan 30 10:00 (older)
   - Web: Jan 30 10:05 (newer)
6. Backend skips mobile sync (newer already exists)
7. Mobile receives: `{ status: 'skipped', reason: 'Newer version exists' }`
8. Mobile deletes temp record, shows: "Expense already synced from another device."

**Last-Write-Wins in Action**:
- If farmer edits expense on mobile (offline): amount 500 → 600
- Then edits on web (online): amount 500 → 550
- Mobile syncs later: Backend sees web edit is newer → mobile edit ignored
- Result: Final amount is 550 (web wins)

---

#### Scenario 3: Partial Sync Failure

**Flow**:
1. Farmer logs 5 expenses offline
2. Farmer comes online, sync triggers
3. Backend processes batch:
   - Expense 1: Success (fertilizer ₹1,200)
   - Expense 2: Success (seeds ₹800)
   - Expense 3: Failed (duplicate - already logged)
   - Expense 4: Success (labour ₹600)
   - Expense 5: Failed (validation error - negative amount)
4. Frontend receives mixed results:
   - 3 success → remove from queue, update cache
   - 2 failed → keep in queue, show errors
5. UI shows:
   - "Synced 3 of 5 expenses successfully!"
   - "2 expenses failed - tap to view details"
6. Farmer opens SyncQueue component:
   - Expense 3: "Failed - duplicate expense (same date/category/amount)"
     - Action: [Delete from Queue] or [Edit & Retry]
   - Expense 5: "Failed - amount cannot be negative"
     - Action: [Edit] (opens form with error highlighted)

---

#### Scenario 4: Storage Quota Exceeded

**Flow**:
1. Farmer logs 500+ expenses over 2 seasons (never clears cache)
2. IndexedDB quota reached (~50 MB on low-end Android)
3. offlineWrapper tries to save expense → QuotaExceededError
4. UI shows: 
   - "Storage full! Clear old data to continue."
   - [Clear Synced Data Older Than 30 Days] button
5. Farmer clicks → delete synced actions, old expenses from cache
6. Retry save → success

**Prevention**:
- Auto-cleanup: Delete synced actions after 7 days (weekly cron)
- Warn at 80% quota: "Storage 80% full - consider clearing old data"

---

## Success Metrics (Phase 2.0 Only)

### Adoption Metrics (Target: Month 1)
- **Expense logging rate**: 60%+ farmers log ≥3 expenses in first month
- **Labour tracking rate**: 40%+ farmers register ≥1 worker
- **Offline usage**: 20%+ actions performed offline, synced later
- **Retention**: 70%+ farmers who log 1 expense return for 2nd expense

### Technical Metrics (Target: Continuous)
- **Sync success rate**: 95%+ offline actions sync without manual intervention
- **Sync latency**: <30 seconds for <50 pending actions
- **Budget alert delivery**: 100% of threshold breaches trigger notification
- **SMS delivery rate**: 98%+ (Twilio standard)
- **API response time**: p95 < 500ms for all endpoints

### User Experience Metrics (Target: User surveys)
- **Ease of expense logging**: 4/5+ avg rating
- **Understanding of offline mode**: 3.5/5+ ("I knew my data would sync later")
- **Clarity of budget status**: 4/5+ ("I understood how much budget remained")
- **Labour payment accuracy**: <5% disputes after using tracker

### Impact Metrics (Target: End of season)
- **Budget adherence**: 60%+ farmers stay within ±15% of planned budget
- **Time saved on record-keeping**: 1+ hour/week (self-reported)
- **Loan applications**: 30%+ farmers export CSV for bank/subsidy

---

## Risk Register (Phase 2.0 Specific)

### Risk 1: Offline Sync Data Loss 🔴 HIGH

**Scenario**: Farmer clears browser cache/app data while offline actions pending  
**Impact**: Pending expenses/attendance lost forever  
**Probability**: Medium (farmers may not understand cache = data)

**Mitigation**:
- Warn before clear: "You have 5 pending actions. Sync first?"
- Export pending actions to JSON file before clear (backup)
- Store last sync timestamp in localStorage (survives cache clear)

**Contingency**: 
- If loss reported, manual data entry by support team from farmer's description
- Phase 2.1: Add "Backup to Cloud" button (export to Google Drive)

---

### Risk 2: Duplicate Expense Entries 🟡 MEDIUM

**Scenario**: Farmer logs same expense on mobile (offline) and web (online), both sync  
**Impact**: Inflated budget spent, incorrect financial records  
**Probability**: Medium (concurrent device use)

**Mitigation**:
- Duplicate detection in backend (same planId/date/category/amount)
- Show warning: "Similar expense already logged - is this a duplicate?"
- Allow farmer to confirm or cancel

**Contingency**:
- Easy delete (swipe or button)
- Bulk duplicate finder in settings: "Find potential duplicates" → list → delete

---

### Risk 3: SMS Cost Runaway 🟡 MEDIUM

**Scenario**: Farmer accidentally sends 100 SMS to all workers daily (forgetting to uncheck)  
**Impact**: High SMS bills (₹40/day = ₹1,200/month)  
**Probability**: Low (but high impact)

**Mitigation**:
- Confirm prompt: "Send SMS to 10 workers? Cost: ₹2"
- Daily SMS limit: 50 SMS/user/day (soft cap, warn at 30)
- Weekly summary email: "You sent 150 SMS this week (₹30)"

**Contingency**:
- Add SMS balance/quota system (prepaid model)
- Farmer buys ₹100 SMS credit, tracked in backend

---

### Risk 4: IndexedDB Not Supported (Old Devices) 🟡 MEDIUM

**Scenario**: Farmer uses Android 4.x device (2015 phone) → no IndexedDB  
**Impact**: Offline mode broken, app only works online  
**Probability**: Low (5% of users)

**Mitigation**:
- Feature detection: Check `window.indexedDB` on load
- Fallback to localStorage (limited to 5MB, but better than nothing)
- Show warning: "Offline mode limited on this device"

**Contingency**:
- Offer web app with no offline (requires constant connection)
- Encourage device upgrade (govt subsidy programs)

---

## Next Steps After Design Approval

1. **Review This Document** (1-2 days)
   - Stakeholder feedback on design choices
   - Confirm API schemas, UI mockups
   - Adjust priorities if needed

2. **Create Detailed Task List** (1 day)
   - Break down week-by-week plan into GitHub issues
   - Assign backend vs frontend tasks
   - Set up project board (To Do, In Progress, Done)

3. **Set Up Development Environment** (1 day)
   - Create `phase-2-dev` Git branch
   - Initialize new backend folders: `/backend/routes/expenses.js`, etc.
   - Initialize new frontend folders: `/src/components/expense-tracker/`, etc.
   - Set up test database (MongoDB separate from Phase 1)

4. **Kickoff Meeting** (1 hour)
   - Review execution plan with team
   - Assign Week 1 tasks (expense backend)
   - Clarify questions on offline architecture

5. **Begin Week 1** (Expense Tracking Backend)
   - Create expenses collection schema
   - Write first API endpoint: `POST /api/expenses`
   - Set up Postman collection for API testing

---

**Document Status**: DESIGN PHASE  
**Awaiting**: Approval to proceed with Phase 2.0 implementation  
**Timeline**: 6-8 weeks from approval  
**Deliverables**: Expense tracking, labour management, offline sync (must-have only)
