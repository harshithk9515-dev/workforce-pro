# WorkForce Pro — Enterprise Project & Workforce Management System

A full-stack MERN application for managing employees, projects, tasks, and team
productivity, with role-based dashboards, PDF/CSV reporting, and an in-app
notification system.

Built for: college final-year submission, internship deliverable, GitHub
portfolio piece, or a resume project.

---

## Tech stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | React 18 (Vite), Tailwind CSS, React Router, Axios, Recharts, lucide-react |
| Backend      | Node.js, Express.js |
| Database     | MongoDB + Mongoose |
| Auth         | JWT (jsonwebtoken) + bcrypt password hashing |
| Reports      | pdfkit (PDF), native CSV streaming |
| Scheduled jobs | node-cron (deadline reminders) |

> **Note on scope decisions:** Vite was used instead of Create React App
> (CRA is deprecated). Auth uses standard JWT bearer tokens with a 7-day
> expiry — there's no refresh-token rotation, which is reasonable for a
> project of this size but worth hardening before any real production use.
> Notifications are in-app only (no email/SMS integration).

---

## Features

- **Auth & RBAC** — register/login, JWT auth, bcrypt hashing, three roles
  (Admin, Project Manager, Employee), with route- and field-level permission
  enforcement on both the API and the UI.
- **Employee management** — CRUD, search, department/status filters, each
  employee linked 1:1 to a login account.
- **Project management** — CRUD, team assignment, status/priority tracking,
  auto-computed progress (from task completion).
- **Task management** — CRUD, assignment, priorities, due dates, status
  tracking (`todo → in-progress → review → completed`).
- **Productivity monitoring** — per-employee and per-team completion rates,
  overdue tracking, aggregation-based dashboards.
- **Dashboards & analytics** — role-specific KPI cards, status-distribution
  donut chart, team productivity bar chart.
- **Reports** — Employee / Project / Productivity reports, exportable as PDF
  or CSV, with a generation history log.
- **Notifications** — task assigned, task completed, deadline reminder
  (daily cron sweep), project update — all in-app with unread counts.

---

## Project structure

```
workforce-pro/
├── backend/
│   ├── server.js                # entry point
│   ├── src/
│   │   ├── app.js               # Express app + middleware stack
│   │   ├── config/              # DB connection, shared enum constants
│   │   ├── models/               # Mongoose schemas (User, Employee, Project, Task, Notification, Report)
│   │   ├── controllers/          # Route handlers
│   │   ├── routes/               # Express routers
│   │   ├── middleware/           # auth, RBAC, validation, error handling
│   │   ├── validators/           # express-validator chains
│   │   ├── services/             # productivity aggregation, notifications, report generation, cron job
│   │   └── seed/seed.js          # demo data seeder
│   └── .env.example
└── frontend/
    ├── index.html
    ├── src/
    │   ├── api/                  # axios service layer (one file per resource)
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── layout/           # Sidebar, Navbar, DashboardLayout, ProtectedRoute
    │   │   ├── common/           # KPICard, Badge, Modal, Pagination, Loader, EmptyState
    │   │   └── charts/           # ProductivityChart, StatusDistributionChart
    │   ├── pages/                 # Login, Register, Dashboard, Employees, Projects, ProjectDetail, Tasks, Reports, Notifications, Profile
    │   └── routes/AppRoutes.jsx
    └── .env.example
```

---

## Role permissions

| Capability                  | Admin | Manager | Employee |
|------------------------------|:---:|:---:|:---:|
| Manage employees (CRUD)      | ✅ | view only | — |
| Manage projects               | ✅ | own projects only | view assigned |
| Assign / manage tasks         | ✅ | own projects' tasks | update own task status |
| View analytics / dashboards   | org-wide | scoped to own team | personal only |
| Generate reports              | ✅ | ✅ | — |
| Manage user accounts/roles    | ✅ | — | — |

---

## Prerequisites

- Node.js 18+
- A MongoDB instance — either local (`mongod` running on `localhost:27017`)
  or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster.

---

## Installation

### 1. Clone and install

```bash
cd workforce-pro/backend
npm install
cp .env.example .env
# edit .env if your MongoDB URI / JWT secret differ from the defaults

cd ../frontend
npm install
cp .env.example .env
# edit .env if your backend isn't running on localhost:5000
```

### 2. Seed the database

From `backend/`:

```bash
npm run seed
```

This clears existing data and creates an admin, two managers, eight
employees, four projects, and a spread of tasks/notifications across them.
To wipe everything without reseeding: `npm run seed:destroy`.

### 3. Run both apps

```bash
# terminal 1
cd backend
npm run dev      # http://localhost:5000

# terminal 2
cd frontend
npm run dev       # http://localhost:5173
```

Visit `http://localhost:5173` and log in with one of the demo accounts below.

---

## Demo credentials (after seeding)

| Role     | Email | Password |
|----------|-------|----------|
| Admin    | `admin@workforcepro.com` | `Admin@12345` |
| Manager  | `vikram.manager@workforcepro.com` | `Manager@123` |
| Manager  | `priya.manager@workforcepro.com` | `Manager@123` |
| Employee | `karan.mehta@workforcepro.com` | `Employee@123` |

(Any seeded employee follows the `firstname.lastname@workforcepro.com` /
`Employee@123` pattern — see the console output of `npm run seed` for the
full list.)

---

## API reference (high level)

All routes are prefixed with `/api`. Protected routes require
`Authorization: Bearer <token>`.

| Resource | Routes |
|----------|--------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/me`, `PATCH /auth/me/password` |
| Users (admin) | `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id` |
| Employees | `GET /employees`, `POST /employees`, `GET /employees/:id`, `PATCH /employees/:id`, `DELETE /employees/:id` |
| Projects | `GET /projects`, `POST /projects`, `GET /projects/:id`, `PATCH /projects/:id`, `DELETE /projects/:id` |
| Tasks | `GET /tasks`, `POST /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `PATCH /tasks/:id/status`, `DELETE /tasks/:id` |
| Dashboard | `GET /dashboard` (role-aware), `GET /dashboard/admin`, `GET /dashboard/manager`, `GET /dashboard/employee` |
| Reports | `GET /reports/:type?format=pdf\|csv` (`type` = `employee`\|`project`\|`productivity`), `GET /reports/history` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id` |

---

## Deployment notes

- **Backend** — deploy to any Node host (Render, Railway, Fly.io, an EC2 box,
  etc.). Set `MONGO_URI` to an Atlas connection string, set a strong
  `JWT_SECRET`, and set `CLIENT_URL` to your deployed frontend's origin (for
  CORS).
- **Frontend** — `npm run build` produces a static `dist/` folder deployable
  to Vercel, Netlify, or any static host. Set `VITE_API_URL` to your deployed
  backend's `/api` URL at build time.
- **Database** — MongoDB Atlas free tier is sufficient for demo/portfolio use.

---

## What's been verified vs. what hasn't

This was built and checked in a sandboxed environment without a running
MongoDB instance, so be aware of the following before you present/submit it:

- ✅ Every backend file passes `node --check` (syntax) and the full Express
  app boots and resolves all its `require()` chains without errors.
- ✅ The frontend builds cleanly with `vite build` (all imports/JSX resolve).
- ✅ Every frontend API call was manually cross-checked against the matching
  backend route, request payload, and response shape.
- ⚠️ **Not verified**: live database reads/writes, the seed script actually
  populating a real database, or a full click-through of the running UI
  against a live API. Run `npm run seed` and click through the app yourself
  once you have MongoDB connected — that's the one step this build couldn't
  do for you in this environment.

---

## License

MIT — use this freely for coursework, internships, or your portfolio.
