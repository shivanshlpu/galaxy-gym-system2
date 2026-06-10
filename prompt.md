# PROMPT.MD — GYM MANAGEMENT & SMART ADMINISTRATION SYSTEM
## Complete Build Instructions for AI Coding Agent (Antigravity / Cursor / Windsurf)

---

> **READ THIS ENTIRE FILE BEFORE WRITING A SINGLE LINE OF CODE.**
> Every section is mandatory. Do not skip. Do not assume. Do not improvise unless a section explicitly says "use best judgment."

---

## 0. PROJECT IDENTITY

**App Name:** GymOS — Smart Admin Panel
**Version:** 1.0 (MVP)
**Target User:** Single gym owner / admin. Members never touch this app.
**Scale:** ~200 active members
**Goal:** Zero-to-minimal recurring hosting cost, full feature parity with the spec below.

---

## 1. DESIGN SYSTEM — "ONYX FITNESS ADMIN SUITE"

The UI must exactly replicate the **Onyx Fitness Admin Suite** design language. Treat this as your design bible. Do not freestyle.

### 1.1 Color Palette

```
--color-bg-primary:       #0A0A0F   /* Near-black app shell background */
--color-bg-surface:       #12121A   /* Card / panel background */
--color-bg-elevated:      #1C1C28   /* Modal, dropdown, active card */
--color-bg-input:         #1E1E2E   /* Input field background */

--color-border:           #2A2A3D   /* Default border / divider */
--color-border-active:    #3D3D5C   /* Focused / hovered border */

--color-accent-primary:   #7C6FF7   /* Purple — primary CTA, active nav, badges */
--color-accent-secondary: #5B8AF5   /* Blue — secondary action, links */
--color-accent-glow:      rgba(124, 111, 247, 0.18)  /* Glow behind accent elements */

--color-status-green:     #22C55E   /* Active / present / paid */
--color-status-yellow:    #F59E0B   /* Warning / expiring soon */
--color-status-red:       #EF4444   /* Expired / absent / urgent */
--color-status-dark-red:  #991B1B   /* Critically expired */

--color-text-primary:     #F1F1F5   /* Headings, primary labels */
--color-text-secondary:   #9494A8   /* Subtext, placeholder, meta */
--color-text-muted:       #5A5A72   /* Disabled, timestamps */

--color-chart-1:          #7C6FF7
--color-chart-2:          #5B8AF5
--color-chart-3:          #22C55E
--color-chart-4:          #F59E0B
--color-chart-5:          #F87171
```

### 1.2 Typography

```css
/* Import in index.html */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

--font-display:  'Space Grotesk', sans-serif;   /* Page titles, stat numbers, nav brand */
--font-body:     'Inter', sans-serif;            /* All body text, labels, inputs */

--text-xs:    0.75rem;   /* 12px — timestamps, badges */
--text-sm:    0.875rem;  /* 14px — table rows, meta */
--text-base:  1rem;      /* 16px — body default */
--text-lg:    1.125rem;  /* 18px — section headers */
--text-xl:    1.25rem;   /* 20px — card titles */
--text-2xl:   1.5rem;    /* 24px — page titles */
--text-3xl:   1.875rem;  /* 30px — stat numbers */
--text-4xl:   2.25rem;   /* 36px — hero stats */
```

### 1.3 Spacing & Layout

```css
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-full: 9999px;

--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);
--shadow-glow: 0 0 20px rgba(124, 111, 247, 0.25);
```

### 1.4 Signature UI Patterns

- **Sidebar:** Fixed left, 240px wide, dark `#0D0D15` background, purple left-border active state indicator (3px solid `--color-accent-primary`), icon + label nav items
- **Stat Cards:** Dark surface cards with a subtle top-border gradient in accent color, large `Space Grotesk` number, small `Inter` label below, status dot
- **Tables:** No outer border, `--color-bg-surface` rows alternating with `--color-bg-elevated`, hover row highlight in `--color-accent-glow`
- **Badges:** Pill shape, color-coded (green/yellow/red/purple), `--text-xs` font
- **Buttons Primary:** `--color-accent-primary` background, white text, `--radius-md`, subtle glow on hover
- **Buttons Secondary:** `--color-border` border, transparent background, text `--color-text-primary`
- **Inputs:** `--color-bg-input` background, `--color-border` border, focus ring `--color-accent-primary`
- **Charts:** Recharts library, dark theme, using `--color-chart-*` palette
- **Scrollbar:** Custom thin scrollbar, `--color-border` track, `--color-accent-primary` thumb

---

## 2. TECH STACK (NON-NEGOTIABLE)

### Frontend
| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 (configure with custom theme tokens from Section 1) |
| Routing | React Router v6 |
| State | Zustand |
| Data fetching | Axios + React Query (TanStack Query v5) |
| Charts | Recharts |
| Icons | Lucide React |
| Date handling | date-fns |
| Notifications (toast) | react-hot-toast |
| Forms | React Hook Form + Zod validation |
| PWA | vite-plugin-pwa |

### Backend
| Layer | Choice |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Database | MongoDB Atlas (Free Tier M0) via Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Scheduler | node-cron |
| Environment | dotenv |
| Validation | Zod (shared schema with frontend) |
| File uploads | multer + sharp (member photos) |
| WhatsApp | OpenWA (see Section 9) |

### Hosting
| Service | Platform |
|---|---|
| Frontend | Vercel (free) |
| Backend | Render (free tier) |
| Database | MongoDB Atlas (free M0 cluster) |
| Media | Cloudinary free tier (member photos) |

---

## 3. FOLDER STRUCTURE

```
gym-os/
├── client/                          # React Vite frontend
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   └── icons/                   # PWA icons (192, 512)
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/              # Button, Input, Badge, Modal, Table, Sidebar, Topbar
│   │   │   ├── dashboard/           # StatCard, AlertStrip, MiniChart
│   │   │   ├── members/             # MemberCard, MemberForm, MemberTable
│   │   │   ├── attendance/          # AttendanceGrid, AttendanceRow
│   │   │   ├── payments/            # PaymentForm, PaymentHistory
│   │   │   ├── reports/             # ReportChart, ReportTable
│   │   │   ├── assistant/           # ChatBubble, AssistantInput
│   │   │   └── alerts/              # AlertCard, NotificationBell
│   │   ├── hooks/                   # useAuth, useMembers, useAttendance, usePayments
│   │   ├── lib/                     # axios instance, queryClient, utils
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Members.jsx
│   │   │   ├── MemberDetail.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Payments.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Alerts.jsx
│   │   │   ├── SmartAssistant.jsx
│   │   │   └── Settings.jsx
│   │   ├── store/                   # Zustand stores
│   │   │   ├── authStore.js
│   │   │   └── appStore.js
│   │   ├── router/
│   │   │   └── index.jsx            # Route definitions + ProtectedRoute
│   │   ├── styles/
│   │   │   └── globals.css          # CSS variables, custom scrollbar, base resets
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js           # Custom theme extending design tokens
│   ├── vite.config.js               # Vite + PWA plugin config
│   └── package.json
│
├── server/                          # Node Express backend
│   ├── config/
│   │   ├── db.js                    # MongoDB Atlas connection
│   │   └── env.js                   # Env validation
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Member.model.js
│   │   ├── Attendance.model.js
│   │   ├── Payment.model.js
│   │   ├── MembershipPlan.model.js
│   │   ├── Notification.model.js
│   │   ├── ActivityLog.model.js
│   │   └── WhatsAppLog.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── members.routes.js
│   │   ├── attendance.routes.js
│   │   ├── payments.routes.js
│   │   ├── reports.routes.js
│   │   ├── notifications.routes.js
│   │   ├── assistant.routes.js
│   │   ├── whatsapp.routes.js
│   │   └── settings.routes.js
│   ├── controllers/                 # One file per route group
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── upload.middleware.js     # Multer
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── membershipChecker.js     # Daily expiry check
│   │   ├── inactivityChecker.js     # Absence tracking
│   │   ├── whatsapp.service.js      # OpenWA wrapper
│   │   ├── assistant.service.js     # NLP query engine
│   │   └── notifications.service.js
│   ├── jobs/
│   │   └── dailyCron.js             # node-cron scheduler
│   ├── utils/
│   │   ├── dateUtils.js
│   │   ├── responseFormatter.js
│   │   └── messageTemplates.js
│   ├── app.js                       # Express app setup
│   ├── server.js                    # Entry point
│   └── package.json
│
├── shared/
│   └── schemas/                     # Zod schemas shared between client and server
│       ├── member.schema.js
│       ├── payment.schema.js
│       └── attendance.schema.js
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. DATABASE SCHEMAS

### 4.1 User (Admin)
```js
{
  _id, 
  email: String (unique, required),
  username: String (unique, required),
  password: String (hashed, required),
  role: { type: String, default: 'admin' },
  gymName: String,
  createdAt, updatedAt
}
```

### 4.2 Member
```js
{
  _id,
  memberId: String,           // Auto-generated: GYM-0001, GYM-0002...
  fullName: String (required),
  phone: String (required, unique),
  address: String,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  age: Number,
  joiningDate: Date (required),
  membershipPlan: ObjectId → MembershipPlan,
  membershipStartDate: Date,
  membershipExpiryDate: Date,  // Auto-calculated: startDate + plan.durationDays
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  status: { type: String, enum: ['Active', 'Expired', 'Inactive'], default: 'Active' },
  photo: String,               // Cloudinary URL
  notes: String,
  whatsappOptIn: { type: Boolean, default: true },
  lastAttendance: Date,        // Denormalized for fast queries
  createdAt, updatedAt
}

// Indexes:
membershipExpiryDate: 1
status: 1
phone: 1 (unique)
```

### 4.3 Attendance
```js
{
  _id,
  member: ObjectId → Member (required),
  date: Date (required),          // Store as start-of-day UTC
  status: { type: String, enum: ['Present', 'Absent'] },
  markedBy: ObjectId → User,
  createdAt
}

// Compound index: { member: 1, date: 1 } unique
// Index: { date: 1 }
```

### 4.4 Payment
```js
{
  _id,
  member: ObjectId → Member (required),
  amount: Number (required),
  paymentDate: Date (required),
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card'] },
  plan: ObjectId → MembershipPlan,
  renewalDate: Date,
  notes: String,
  receiptNumber: String,          // Auto-generated
  createdAt
}

// Index: { member: 1 }
// Index: { paymentDate: -1 }
```

### 4.5 MembershipPlan
```js
{
  _id,
  name: String (required),        // e.g., "Monthly", "Quarterly", "Annual"
  durationDays: Number (required),
  price: Number (required),
  description: String,
  isActive: { type: Boolean, default: true },
  createdAt
}
```

### 4.6 Notification
```js
{
  _id,
  type: { type: String, enum: [
    'expiry_7d', 'expiry_5d', 'expiry_3d', 'expiry_tomorrow', 
    'expired', 'absent_3d', 'absent_5d', 'absent_10d', 'payment_pending'
  ]},
  member: ObjectId → Member,
  message: String,
  isRead: { type: Boolean, default: false },
  whatsappSent: { type: Boolean, default: false },
  whatsappSentAt: Date,
  createdAt
}
```

### 4.7 ActivityLog
```js
{
  _id,
  action: String,                // 'member_added', 'attendance_marked', 'payment_recorded'...
  entityType: String,            // 'Member', 'Attendance', 'Payment'
  entityId: ObjectId,
  performedBy: ObjectId → User,
  details: Mixed,                // JSON snapshot
  createdAt
}
```

### 4.8 WhatsAppLog
```js
{
  _id,
  member: ObjectId → Member,
  phone: String,
  messageType: String,
  messageText: String,
  status: { type: String, enum: ['sent', 'failed', 'pending'] },
  error: String,
  sentAt: Date,
  createdAt
}
```

---

## 5. API ROUTES

**Base URL:** `/api/v1`  
**All routes except `/auth/login` require `Authorization: Bearer <token>` header.**

### Auth
```
POST   /auth/login          { email/username, password } → { token, user }
POST   /auth/logout
GET    /auth/me
PUT    /auth/change-password
```

### Members
```
GET    /members              ?search=&status=&plan=&page=&limit=
POST   /members              Create member
GET    /members/:id          Single member with full stats
PUT    /members/:id          Update member
DELETE /members/:id          Soft delete (set status = 'Deleted')
POST   /members/:id/photo    Upload photo (multipart)
GET    /members/stats/summary  Dashboard summary counts
GET    /members/expiring     Members expiring in next 7 days
GET    /members/inactive     Members absent 3/5/10+ days
```

### Attendance
```
GET    /attendance           ?date=&memberId=&page=&limit=
POST   /attendance/bulk      Mark attendance for multiple members at once
PUT    /attendance/:id       Update single record
GET    /attendance/today     Today's full attendance sheet
GET    /attendance/member/:id?startDate=&endDate=  Member attendance history
GET    /attendance/absent    Members absent today
GET    /attendance/stats     Aggregated stats for reports
```

### Payments
```
GET    /payments             ?memberId=&startDate=&endDate=&method=
POST   /payments             Record payment
GET    /payments/:id
PUT    /payments/:id
DELETE /payments/:id
GET    /payments/member/:id  All payments for a member
GET    /payments/revenue/monthly   Monthly revenue chart data
GET    /payments/revenue/summary   Total/pending/this-month stats
```

### Membership Plans
```
GET    /plans                All active plans
POST   /plans                Create plan
PUT    /plans/:id
DELETE /plans/:id
```

### Notifications
```
GET    /notifications        ?isRead=false&type=
PUT    /notifications/:id/read
PUT    /notifications/read-all
DELETE /notifications/old    Clear notifications older than 30 days
GET    /notifications/count  Unread count for bell icon
```

### Reports
```
GET    /reports/daily        ?date=
GET    /reports/weekly       ?startDate=
GET    /reports/monthly      ?year=&month=
GET    /reports/yearly       ?year=
GET    /reports/revenue      ?period=month|year&value=
GET    /reports/attendance   ?period=&value=
```

### Smart Assistant
```
POST   /assistant/query      { query: "natural language text" } → { answer, data }
GET    /assistant/suggestions  Pre-built quick query suggestions
```

### WhatsApp
```
GET    /whatsapp/status         QR/connected status
POST   /whatsapp/send           { memberId, type } Manual send
POST   /whatsapp/send-bulk      Bulk send to list
GET    /whatsapp/logs           ?memberId=&status=
GET    /whatsapp/qr             QR code image for pairing
```

### Settings
```
GET    /settings
PUT    /settings                { gymName, logo, planSettings, reminderDays, ... }
```

---

## 6. FRONTEND PAGES — DETAILED SPEC

### 6.1 Login Page (`/login`)

**Layout:** Full-screen centered card on `--color-bg-primary` background.

**Elements:**
- GymOS logo/wordmark (top center)
- Gym name subtitle
- `Space Grotesk` heading: "Welcome Back"
- Email/Username input
- Password input (with show/hide toggle)
- "Sign In" button (full width, primary accent)
- Error state: inline red alert below form

**Behavior:**
- On success → redirect to `/dashboard`
- Store JWT in `localStorage` under key `gymosToken`
- Persist user info in Zustand `authStore`
- If already logged in, redirect away from `/login`

---

### 6.2 Layout Shell (Wraps all protected pages)

**Sidebar (240px fixed left):**
```
Logo + "GymOS" wordmark (top)
━━━━━━━━━━━━━━━━━━
MAIN
  📊 Dashboard
  👥 Members
  ✅ Attendance
  💳 Payments

ANALYTICS
  📈 Reports
  🔔 Alerts        [badge: unread count]

TOOLS
  🤖 Smart Assistant
  ⚙️  Settings

━━━━━━━━━━━━━━━━━━
[Avatar] Admin Name
[Logout button]
```

Active item: left purple border (3px), `--color-accent-glow` background tint, white text  
Inactive item: `--color-text-secondary`, no border

**Top Bar (full width, 64px tall):**
- Page title (current page)
- Search bar (global member search, opens modal)
- Notification bell (with badge count → links to `/alerts`)
- Today's date + day

**Mobile:** Sidebar collapses to bottom tab bar on screens < 768px (PWA behavior)

---

### 6.3 Dashboard (`/dashboard`)

**Row 1 — Stat Cards (4 across):**

| Card | Value Source | Color |
|---|---|---|
| Total Members | `members.count` | Purple accent |
| Active Members | `members.active` | Green |
| Expiring Soon | `members.expiring7d` | Yellow |
| Expired | `members.expired` | Red |

**Row 2 — Stat Cards (4 across):**

| Card | Value Source | Color |
|---|---|---|
| Today's Present | `attendance.todayPresent` | Green |
| Today's Absent | `attendance.todayAbsent` | Red |
| Monthly Revenue | `payments.thisMonth` | Purple |
| Pending Payments | `payments.pending` | Yellow |

**Row 3 — Charts (2 across):**
- **Monthly Attendance Chart:** Bar chart, last 30 days, `--color-chart-3` bars
- **Revenue Chart:** Line chart, last 6 months, `--color-chart-1` line with area fill

**Row 4 — Tables (2 across):**
- **Expiring Memberships:** Name, phone, expiry date, days remaining (color-coded badge), WhatsApp button
- **Recent Activity:** Last 10 activity log entries with type icon, description, timestamp

**Alert Strip (below top bar if any urgent alerts):**
- Red/yellow strip with count and quick action button

---

### 6.4 Members Page (`/members`)

**Header:**
- Page title "Members"
- "+ Add Member" button (primary)
- Search input (filter by name/phone)
- Filter dropdowns: Status, Plan, Gender

**Table columns:**
```
[Photo thumb] | Member ID | Full Name | Phone | Plan | Expiry | Days Left | Status Badge | Actions
```

**Days Left badge color rules:**
- > 30 days → green
- 7–30 days → yellow  
- 1–6 days → red
- 0 (expired) → dark red pill "EXPIRED"

**Actions per row:** View 👁 | Edit ✏️ | Delete 🗑 | WhatsApp 💬

**Pagination:** 20 per page, server-side

**Add/Edit Member — Slide-over panel (right side, not modal):**
```
Full Name *
Phone *
Email
Address
Gender (radio)
Age
Membership Plan * (dropdown from plans)
Start Date *  →  Expiry auto-calculates
Payment Status (dropdown)
Notes (textarea)
Photo upload (drag & drop, optional)
```

**Member Detail Page (`/members/:id`):**
- Profile header: photo, name, ID, status badge, WhatsApp button
- Stats row: joined X days ago, plan name, X days remaining
- Tabs: Overview | Attendance History | Payment History | Notes
- Overview tab: all fields editable inline
- Attendance History: calendar heatmap + list view
- Payment History: table of all payments + "Record Payment" button

---

### 6.5 Attendance Page (`/attendance`)

**Header:**
- Page title "Attendance"
- Date picker (default: today)
- "Mark All Present" quick action button
- Export CSV button

**Attendance Grid:**
- All active members listed
- Each row: photo thumb | name | phone | plan | last 7 days mini-streak (green/red dots) | TODAY toggle (Present / Absent)
- Toggle is a large, tappable pill button — green "Present" or red "Absent"
- Bulk actions: select checkboxes → mark all selected as Present/Absent

**Stats bar below header:**
- Total present | Total absent | Attendance rate %

**Bottom tabs (sub-views):**
- Daily | Weekly | Monthly (chart views of attendance stats)

---

### 6.6 Payments Page (`/payments`)

**Header:**
- Page title "Payments & Revenue"
- Date range picker
- "+ Record Payment" button (primary)
- Filter: method (Cash/UPI/Card)

**Revenue Summary Row (3 cards):**
- This Month's Revenue
- Total Collected (all time)
- Pending Amount

**Table:**
```
Receipt # | Member Name | Amount | Method | Plan | Date | Notes | Actions
```

**Record Payment — Modal:**
```
Member (searchable dropdown) *
Amount *
Payment Date *
Method (Cash / UPI / Card) *
Membership Plan *
Renewal Date (auto from plan duration)
Notes
```
On submit: update member's `paymentStatus` to 'Paid', `membershipExpiryDate` recalculated.

**Revenue Chart:** Bar chart monthly breakdown (current year)

---

### 6.7 Alerts / System Alerts Page (`/alerts`)

**Alert Categories (tabs):**
1. **Membership Expiry** — sorted by urgency (tomorrow first)
2. **Inactive Members** — absent 3 / 5 / 10 days sub-filters
3. **Payment Pending**
4. **All** — merged, unread first

**Each alert card:**
- Severity icon (🔴 🟡 🟢)
- Member name, phone
- Alert message ("Expires in 2 days", "Absent for 5 days")
- Timestamp
- Action buttons: "Send WhatsApp" | "Mark as Read" | "View Member"

**Bulk actions:** "Send WhatsApp to All Expiring" | "Mark All as Read"

---

### 6.8 Smart Assistant Page (`/assistant`)

**Layout:** Chat interface, dark theme

**Input area (bottom, sticky):**
- Text input: "Ask anything about your gym..."
- Send button
- Suggested query chips (horizontal scroll): "Who's absent today?", "Revenue this month", "Expiring this week", "New members today", "Inactive members"

**Chat area:**
- User message: right-aligned, purple bubble
- Assistant response: left-aligned, dark surface card
- Responses include formatted data (tables, lists, numbers)
- Loading: animated 3-dot pulse

**Query Engine (Backend):**  
This is NOT a paid AI. It is a **rule-based NLP matcher** on the backend. See Section 10 for full implementation details.

---

### 6.9 Reports Page (`/reports`)

**Period tabs:** Daily | Weekly | Monthly | Yearly

**Each period view includes:**
- New Members (count + list)
- Renewals (count + revenue)
- Attendance Rate (%)
- Revenue Breakdown (by method)
- Inactive Members
- Expired Members

**Charts:**
- Attendance bar chart
- Revenue line chart
- Member growth line chart
- Payment method pie chart

**Export button:** Download as PDF (use browser print / jsPDF)

---

### 6.10 Settings Page (`/settings`)

**Sections:**
1. Gym Info: name, logo upload, contact
2. Membership Plans: list + add/edit/delete plans
3. Reminder Settings: which days to send reminders (checkboxes: 7d, 5d, 3d, 1d, expired)
4. WhatsApp: connection status, QR code display, test message
5. Admin Account: change password, email

---

## 7. AUTHENTICATION IMPLEMENTATION

### Backend
```js
// auth.middleware.js
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Frontend
```js
// store/authStore.js (Zustand)
{
  token: localStorage.getItem('gymosToken'),
  user: null,
  isAuthenticated: false,
  login: async (credentials) => { ... },
  logout: () => { localStorage.removeItem('gymosToken'); ... }
}

// router/index.jsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
```

JWT expiry: 7 days. Refresh: if token < 1 day to expiry, auto-refresh on any request.

---

## 8. DAILY CRON JOB — EXACT LOGIC

```js
// jobs/dailyCron.js — runs every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  await checkMembershipExpiry();
  await checkInactiveMembers();
  await generateDashboardCache();
  await cleanOldNotifications();
});

async function checkMembershipExpiry() {
  const today = startOfDay(new Date());
  const thresholds = [1, 3, 5, 7];  // days ahead
  
  for (const days of thresholds) {
    const targetDate = addDays(today, days);
    const members = await Member.find({
      membershipExpiryDate: {
        $gte: startOfDay(targetDate),
        $lt: endOfDay(targetDate)
      },
      status: 'Active'
    });
    
    for (const member of members) {
      await createOrUpdateNotification(member, `expiry_${days}d`);
      if (member.whatsappOptIn) {
        await whatsappService.sendReminder(member, days);
      }
    }
  }
  
  // Check already expired
  const expired = await Member.find({
    membershipExpiryDate: { $lt: today },
    status: 'Active'
  });
  for (const member of expired) {
    await Member.findByIdAndUpdate(member._id, { status: 'Expired' });
    await createNotification(member, 'expired');
  }
}

async function checkInactiveMembers() {
  const today = startOfDay(new Date());
  const thresholds = [3, 5, 10];
  
  for (const days of thresholds) {
    const cutoff = subDays(today, days);
    const members = await Member.find({
      status: 'Active',
      $or: [
        { lastAttendance: { $lt: cutoff } },
        { lastAttendance: null }
      ]
    });
    for (const member of members) {
      await createOrUpdateNotification(member, `absent_${days}d`);
    }
  }
}
```

---

## 9. WHATSAPP INTEGRATION (OPENWA)

> **IMPORTANT:** OpenWA uses an unofficial WhatsApp automation library. Use a **dedicated gym phone number**. Never use the owner's personal number.

### Setup
```
Repository: https://github.com/rmyndharis/OpenWA
Run OpenWA as a separate microservice on the same Render server or locally.
Backend communicates with it via HTTP calls to localhost:3001 (or env-configured URL).
```

### Service Architecture
```js
// services/whatsapp.service.js

const OPENWA_URL = process.env.OPENWA_URL || 'http://localhost:3001';

async function sendMessage(phone, message) {
  const formattedPhone = phone.replace(/\D/g, '') + '@c.us';
  const response = await axios.post(`${OPENWA_URL}/send`, {
    phone: formattedPhone,
    message
  });
  return response.data;
}

async function sendReminder(member, daysLeft) {
  const template = getTemplate('expiry', { member, daysLeft });
  return sendMessage(member.phone, template);
}

async function sendWelcome(member) {
  const template = getTemplate('welcome', { member });
  return sendMessage(member.phone, template);
}
```

### Message Templates
```js
// utils/messageTemplates.js
const templates = {
  welcome: ({ member }) => 
    `Hello ${member.fullName}! 🏋️\n\nWelcome to our gym! Your membership starts today.\n\nWe're excited to have you on board.\n\nThank you! 💪`,

  expiry: ({ member, daysLeft }) => 
    `Hello ${member.fullName},\n\nYour gym membership will expire in *${daysLeft} day${daysLeft > 1 ? 's' : ''}*.\n\nPlease renew your membership to continue training without interruption.\n\nContact us to renew. Thank you! 🙏`,

  expired: ({ member }) =>
    `Hello ${member.fullName},\n\nYour gym membership has *expired*.\n\nPlease renew at the earliest to resume your fitness journey.\n\nThank you! 💪`,

  inactive: ({ member, absentDays }) =>
    `Hello ${member.fullName},\n\nWe miss you at the gym! You haven't visited in *${absentDays} days*.\n\nCome back and continue your fitness journey. We're here for you! 🏋️`
};
```

### WhatsApp module must be modular:
- All WhatsApp calls go through `whatsapp.service.js` only
- A config flag `WHATSAPP_ENABLED=true/false` in `.env` disables all sending without code changes
- Log every attempt (success or fail) to `WhatsAppLog` collection

---

## 10. SMART ASSISTANT — QUERY ENGINE

This is a **zero-cost, rule-based query engine**. No AI API calls.

### Architecture
```
User types query → backend /assistant/query →
  1. Tokenize and normalize query
  2. Match against intent patterns (regex + keyword)
  3. Execute corresponding DB query
  4. Format response
  5. Return structured answer
```

### Intents and Patterns

```js
// services/assistant.service.js

const intents = [
  {
    id: 'new_members_today',
    patterns: [/new member.*(today|this day)/i, /how many.*joined.*today/i, /today.*new/i],
    handler: async () => {
      const today = startOfDay(new Date());
      const members = await Member.find({ joiningDate: { $gte: today } });
      return {
        answer: `Today ${members.length} new member${members.length !== 1 ? 's' : ''} joined${members.length > 0 ? ':\n' + members.map(m => `• ${m.fullName}`).join('\n') : '.'}`,
        data: members
      };
    }
  },
  {
    id: 'absent_today',
    patterns: [/who.*absent.*today/i, /absent.*today/i, /not.*attend.*today/i],
    handler: async () => { /* Query attendance for today, find absent */ }
  },
  {
    id: 'expiring_this_week',
    patterns: [/expir.*(this week|7 days|week)/i, /membership.*expir.*/i],
    handler: async () => { /* Find members expiring in 7 days */ }
  },
  {
    id: 'active_members',
    patterns: [/how many.*active/i, /active member.*/i, /total active/i],
    handler: async () => { /* Count active members */ }
  },
  {
    id: 'revenue_this_month',
    patterns: [/revenue.*(this month|month)/i, /how much.*collect/i, /monthly.*income/i, /earnings/i],
    handler: async () => { /* Sum payments for current month */ }
  },
  {
    id: 'inactive_members',
    patterns: [/inactive/i, /not attend.*(5|five) days/i, /absent.*days/i],
    handler: async () => { /* Find members absent 5+ days */ }
  },
  {
    id: 'today_attendance',
    patterns: [/attendance.*today/i, /today.*attendance/i, /how many.*present/i],
    handler: async () => { /* Count today's present/absent */ }
  },
  {
    id: 'pending_payments',
    patterns: [/pending payment/i, /who.*not paid/i, /payment.*due/i],
    handler: async () => { /* Find members with paymentStatus = 'Pending' */ }
  },
  {
    id: 'total_members',
    patterns: [/total member/i, /how many member/i, /member count/i],
    handler: async () => { /* Count all non-deleted members */ }
  },
  {
    id: 'new_members_month',
    patterns: [/new member.*(this month|month)/i, /joined.*(this month|month)/i],
    handler: async () => { /* New members in current month */ }
  }
];

// Fallback for unknown queries
const fallbackResponse = {
  answer: "I didn't understand that query. Try asking:\n• Who is absent today?\n• How many active members?\n• Which memberships expire this week?\n• What is this month's revenue?",
  data: null
};
```

### Suggested Quick Queries (shown as chips in UI)
```
"Who is absent today?"
"How many members are active?"
"Which memberships expire this week?"
"What is this month's revenue?"
"Who has not attended for 5 days?"
"How many members joined today?"
"List pending payments"
"What is today's attendance count?"
```

---

## 11. TAILWIND CONFIGURATION

```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0F',
          surface: '#12121A',
          elevated: '#1C1C28',
          input: '#1E1E2E',
        },
        border: {
          DEFAULT: '#2A2A3D',
          active: '#3D3D5C',
        },
        accent: {
          primary: '#7C6FF7',
          secondary: '#5B8AF5',
        },
        status: {
          green: '#22C55E',
          yellow: '#F59E0B',
          red: '#EF4444',
          darkred: '#991B1B',
        },
        text: {
          primary: '#F1F1F5',
          secondary: '#9494A8',
          muted: '#5A5A72',
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(124, 111, 247, 0.25)',
      }
    }
  },
  plugins: []
}
```

---

## 12. ENVIRONMENT VARIABLES

```bash
# server/.env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/gymos
JWT_SECRET=your_very_long_random_secret_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
OPENWA_URL=http://localhost:3001
WHATSAPP_ENABLED=false
FRONTEND_URL=http://localhost:5173

# client/.env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 13. PWA CONFIGURATION

```js
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'GymOS Admin',
    short_name: 'GymOS',
    theme_color: '#7C6FF7',
    background_color: '#0A0A0F',
    display: 'standalone',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
})
```

---

## 14. ERROR HANDLING STANDARDS

### API Response Format (always consistent)
```js
// Success
{ success: true, data: { ... }, message: "Optional message" }

// Error
{ success: false, error: "Error description", code: "ERROR_CODE" }

// Paginated list
{ success: true, data: [...], pagination: { total, page, limit, pages } }
```

### Frontend Error Handling
- All API errors caught in React Query, shown via `react-hot-toast`
- Network errors: toast "Check your connection"
- 401: redirect to login, clear token
- 500: toast "Server error. Please try again."
- Form errors: inline below the field via React Hook Form

---

## 15. BUILD ORDER — FOLLOW EXACTLY

Build in this sequence. Do not start a phase until the previous is done and tested.

### Phase 1 — Foundation (Backend)
1. Project setup (both client and server `package.json`, install all deps)
2. MongoDB connection + env config
3. All Mongoose models
4. Auth routes + middleware (login, logout, me)
5. Test auth with Postman/curl

### Phase 2 — Core Backend APIs
6. Members CRUD routes + controller
7. Membership Plans routes
8. Attendance routes
9. Payments routes
10. Reports aggregation routes
11. Notifications routes
12. Assistant query engine (no DB yet, just pattern matching)

### Phase 3 — Automation
13. Daily cron job (expiry checker + inactive checker)
14. Notification generation service
15. WhatsApp service (with WHATSAPP_ENABLED=false flag first)

### Phase 4 — Frontend Foundation
16. Vite + React + Tailwind setup with full token system
17. Layout shell: Sidebar + Topbar (responsive)
18. Login page + auth store + protected routes
19. Axios instance + React Query setup

### Phase 5 — Frontend Pages
20. Dashboard (all stat cards + charts)
21. Members list + add/edit slide-over
22. Member detail page
23. Attendance page
24. Payments page
25. Alerts page
26. Smart Assistant chat
27. Reports page
28. Settings page

### Phase 6 — Polish & PWA
29. Loading states, skeleton screens
30. Empty states (all tables/lists)
31. Mobile responsive passes
32. PWA manifest + service worker
33. Error boundaries

### Phase 7 — Deployment
34. Deploy backend to Render (with env vars)
35. Deploy frontend to Vercel (with `VITE_API_URL` pointing to Render)
36. MongoDB Atlas network whitelist: allow Render's IPs

---

## 16. CRITICAL DO-NOTS

- ❌ DO NOT install OpenAI, Gemini, or any paid AI SDK
- ❌ DO NOT use `create-react-app` — use Vite only
- ❌ DO NOT use `moment.js` — use `date-fns` only
- ❌ DO NOT store passwords in plain text — always bcrypt (salt rounds: 12)
- ❌ DO NOT use `window.alert()` or `window.confirm()` — use custom modal/toast
- ❌ DO NOT hardcode any MongoDB URI or JWT secret in source code
- ❌ DO NOT allow members to access any route — admin only
- ❌ DO NOT skip the WhatsApp module flag (`WHATSAPP_ENABLED`) — it must be toggleable
- ❌ DO NOT use inline styles — use Tailwind classes exclusively
- ❌ DO NOT use `any` type or skip validation on API inputs — Zod validates everything

---

## 17. SEED DATA

Create a `server/scripts/seed.js` that seeds:
- 1 admin user: email `admin@gymos.com`, password `Admin@123`
- 4 membership plans: Monthly (30d, ₹800), Quarterly (90d, ₹2200), Half-Year (180d, ₹4000), Annual (365d, ₹7000)
- 10 sample members with varied expiry dates (some active, some expiring soon, one expired)
- 20 attendance records for the last 7 days
- 5 payment records

Run with: `node scripts/seed.js`

---

## 18. README REQUIREMENTS

The final `README.md` must include:
1. Project description
2. Tech stack
3. Local development setup (step by step)
4. Environment variables table
5. API documentation summary
6. Deployment guide (Render + Vercel + MongoDB Atlas)
7. WhatsApp setup guide
8. Seed data instructions

---

## DONE. BUILD IT.

Every section above is mandatory. Every naming convention above is the law. Follow the build order. Follow the design system. Do not improvise architecture. Ask for clarification only if something is genuinely contradictory — not because you want to simplify.

The output must be a production-ready, deployable, real application.
