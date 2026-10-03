# OfficeFlow CRM

OfficeFlow CRM is a full-stack, enterprise-grade office Customer Relationship Management web application designed for day-to-day employee productivity, team management, deal pipeline execution, and administrative control.

---

## 1. Technology Architecture

- **Frontend**:
  - React 18, TypeScript, Vite
  - Tailwind CSS + Lucide Icons
  - React Router DOM v6
  - Recharts for data visualizations
  - React Hook Form + Zod
- **Backend**:
  - Node.js, Express, TypeScript
  - Mongoose 8 with MongoDB
  - Helmet, CORS, Cookie-parser, Express-Rate-Limit
  - Persistent server-managed sessions with HttpOnly cookies & CSRF mitigation
  - Vitest + Supertest for integration and permission tests
- **Database**:
  - MongoDB (MongoDB Atlas, Local MongoDB, or automatic embedded Replica Set fallback with full transaction support)

---

## 2. Prerequisites

- **Node.js**: `v18.x` or higher (tested on `v22.x`)
- **npm**: `v9.x` or higher
- **MongoDB**: MongoDB Atlas cluster, local MongoDB instance, or MongoDB Compass

---

## 3. Installation & Getting Started

### Clone or navigate to the repository:
```bash
cd "C:\Users\samir mulla\.gemini\antigravity\scratch\officeflow-crm"
```

### Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## 4. Environment Variables

Create `.env` inside `server/` using `server/.env.example` as reference:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://eliyasmulla79_db_user:<db_password>@officeflowcrm.clvjzzu.mongodb.net/?appName=OfficeFlowCRM
JWT_SECRET=super_secret_officeflow_jwt_key_2026_dev_mode
SESSION_SECRET=super_secret_officeflow_session_key_2026_dev_mode
CORS_ORIGIN=http://localhost:5173
ENABLE_AI_ASSISTANT=false
GEMINI_API_KEY=
DEFAULT_OFFICE_TIMEZONE=Asia/Kolkata
DEFAULT_CURRENCY=INR
```

> **Note on Database Connection**:
> - If `MONGODB_URI` contains `<db_password>` or is unreachable in local development, OfficeFlow CRM automatically starts an embedded MongoDB Replica Set using `mongodb-memory-server` with **full multi-document transaction support**.
> - As soon as you replace `<db_password>` with your real Atlas password, it will seamlessly connect directly to your remote MongoDB Atlas cluster.

---

## 5. MongoDB Compass Connection Instructions

**MongoDB Compass** is the official graphical client for MongoDB. It connects to your database using the exact same connection string configured in `MONGODB_URI`.

1. Download and open **MongoDB Compass**.
2. Click **New Connection**.
3. Paste your connection string (replace `<db_password>` with your database user password):
   ```text
   mongodb+srv://eliyasmulla79_db_user:YOUR_ACTUAL_PASSWORD@officeflowcrm.clvjzzu.mongodb.net/?appName=OfficeFlowCRM
   ```
4. Click **Connect**.
5. You can now inspect collections (`users`, `teams`, `leads`, `contacts`, `companies`, `deals`, `tasks`, `activities`, `audits`, `sessions`).

### Replica Set Requirement for Atomic Transactions
Mongoose multi-document transactions (used during Lead Conversion) require a MongoDB Replica Set:
- **MongoDB Atlas**: Replica sets are enabled by default on all clusters (M0 free tier and above).
- **Local MongoDB**: If running standalone `mongod`, enable replica sets with `mongod --replSet rs0`.
- **Embedded Dev Mode**: When running without local mongod, OfficeFlow CRM initializes an embedded single-node replica set automatically.

---

## 6. Admin Bootstrap & Demo Seeding

### Option A: Development Seed (Recommended)
Populates realistic fictional Indian office data (Admin, 2 Team Managers, 4 Employees, 2 Teams, Companies, Contacts, Leads across all statuses, Deals across all stages, Tasks, and Activities):

```bash
cd server
npm run seed
```

**Seed Credentials**:
- **Admin**: `admin@officeflow.internal` (Password: `OfficeFlow@2026`)
- **Manager (North Team)**: `priya.nair@officeflow.internal` (Password: `OfficeFlow@2026`)
- **Manager (South Team)**: `amit.verma@officeflow.internal` (Password: `OfficeFlow@2026`)
- **Employee (North Team)**: `kavita.patel@officeflow.internal` (Password: `OfficeFlow@2026`)
- **Employee (South Team)**: `ananya.iyer@officeflow.internal` (Password: `OfficeFlow@2026`)

### Option B: Clean Admin Bootstrap
Creates only the initial administrator account without test records:

```bash
cd server
npm run bootstrap:admin
```

---

## 7. Running the Application

### Start the Backend Server:
```bash
cd server
npm run dev
```
Backend API will run on `http://localhost:5000`.

### Start the Frontend Client:
In a separate terminal:
```bash
cd client
npm run dev
```
Frontend application will open on `http://localhost:5173`.

---

## 8. Role-Based Access Control (RBAC) Matrix

| Entity / Action | Admin | Manager | Employee |
| :--- | :--- | :--- | :--- |
| **All Records (Office-wide)** | Full Access (Read/Write/Archive) | No (Team only) | No (Assigned only) |
| **Team Records** | Full Access | Full Access for assigned Team | Read/Write only if assigned to them |
| **Lead Creation** | Any assignee / Team | Assign to own team members | Self-assigned only |
| **Lead Assignment** | Assign anyone to any team | Assign only within own team | Cannot reassign |
| **Lead Conversion** | Yes | Yes (Team leads) | Yes (Own leads) |
| **Deals & Pipeline** | Office-wide | Team deals | Own deals |
| **Tasks & Activities** | Office-wide | Team tasks & activities | Own tasks & activities |
| **Employee & Team Management** | Invite, Deactivate, Move, Roles | View team members & workloads | Cannot view or manage users |
| **Settings & Audit Logs** | Manage settings, view audit | Denied (403) | Denied (403) |
| **Reports & Exports** | Office-wide aggregate | Team aggregate | Self performance only |

---

## 9. Testing & Verification

Run the comprehensive automated test suite (covering authentication, session revocation, RBAC matrix, record scoping, and atomic lead conversions):

```bash
cd server
npm test
```

### Production Build:
```bash
# Build backend TypeScript
cd server
npm run build

# Build frontend bundle
cd ../client
npm run build
```

---

## 10. Security & Production Deployment Considerations

1. **Persistent Sessions**: Sessions are stored in MongoDB with 7-day TTL and signed HttpOnly cookies.
2. **Deactivation Policy**: When an employee is deactivated, all their active sessions are revoked instantly, preventing further API access. Open leads/deals/tasks can be reassigned during deactivation.
3. **Admin Protection**: The system prevents removing or deactivating the last remaining active administrator.
4. **CSV Export Protection**: All CSV exports sanitize cells against spreadsheet formula injection attacks (`=`, `+`, `-`, `@`).
5. **Backups & Restore**: Use `mongodump` and `mongorestore` with your `MONGODB_URI` for scheduled database snapshots.
