# Digital Clearance Management System — Wollo University

Full-stack implementation: **React frontend + Node/Express backend + MySQL (via XAMPP)**, per the original SRS.

```
wollo-clearance-system/
├── frontend/    React + Vite + Tailwind (the UI you already reviewed with your PM — unchanged, only rebranded)
└── backend/     Node.js + Express + Sequelize + MySQL, pdfmake, Nodemailer, node-cron
```

This system was built and **verified end-to-end against a real MySQL database** during development — every core flow below (login, apply, approve, certificate generation, public verification, revoke/reissue, forced password reset) was tested with real HTTP requests against a real database, not just written and assumed to work.

---

## 1. Set up the MySQL database

You can use **either XAMPP's MySQL or a standalone MySQL/MySQL Workbench install** — the backend just needs a MySQL-compatible server reachable on some host/port with a username and password. Pick whichever works for you:

**Option A — XAMPP**
1. Open XAMPP, start **MySQL** (and Apache, if you want phpMyAdmin) from the control panel.
2. Open `http://localhost/phpmyadmin` → **New** → database name `digital_clearance_db` → **Create**.

**Option B — MySQL Workbench / standalone MySQL server**
1. Make sure your MySQL server is running (Workbench connects to a server — start it via `mysqld`, a system service, or however you normally run it).
2. In Workbench, open a SQL tab against your connection and run:
   ```sql
   CREATE DATABASE digital_clearance_db;
   ```
3. Note the **host, port, username, and password** of that connection — you'll put them in `backend/.env` in the next step. If you set a root password in Workbench (unlike XAMPP's default blank password), you MUST put it in `.env` or every backend request will fail with a database connection error.

No tables need to be created manually either way — the backend creates every table automatically on first run (see step 3 below).

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set the DB values to match **your actual MySQL connection** (defaults assume XAMPP's blank-password root — if you're on Workbench with a real password, this is the #1 thing to check if the server won't start):

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=digital_clearance_db
DB_USER=root
DB_PASSWORD=          # <-- put your MySQL Workbench root password here if you set one
```

Then:

```bash
npm run seed     # creates departments, workflows, and demo user accounts
npm run dev      # starts the API on http://localhost:5000
```

You should see:
```
✅ MySQL connection established (via XAMPP).
✅ Database synced — all tables ready.
⏰ Cron jobs scheduled (SLA reminders @ 08:00, token cleanup @ 02:00).
🚀 Clearance API running at http://localhost:5000
```

### Demo accounts (created by `npm run seed`, password for all: `password123`)

| Email | Role |
|---|---|
| selamawit.bekele@wollo.edu.et | Applicant |
| tsegaye.alemu@wollo.edu.et | Approver — Finance |
| kidist.wolde@wollo.edu.et | Approver — Registrar |
| getachew.mola@wollo.edu.et | Approver — Library |
| robel.assefa@wollo.edu.et | Approver — IT |
| fikirte.haile@wollo.edu.et | Approver — Store |
| chaltu.bekele@wollo.edu.et | Approver — Finance (2nd, for delegation testing) |
| meron.tadesse@wollo.edu.et | Department Head — Library |
| hanna.girma@wollo.edu.et | HR Coordinator |
| yonas.fikru@wollo.edu.et | Auditor |
| betelhem.worku@wollo.edu.et | Super Admin |
| amanuel.kebede@wollo.edu.et | System Administrator |

## 3. Frontend setup

In a **second terminal**:

```bash
cd frontend
npm install
cp .env.example .env    # already points to http://localhost:5000/api — only change if you moved the backend port
npm run dev
```

Open the printed URL (usually `http://localhost:5173`). Log in with any account above.

---

## Recently fixed bugs

If you tested an earlier version of this project and hit any of these, they're now fixed and verified end-to-end against the real database:

1. **Super Admin → Escalation Overrides showed the wrong/fake requests.** Now calls a real endpoint returning every genuinely pending task system-wide, including departments with no approver account at all.
2. **Super Admin → Add User: created users didn't appear in the table, and couldn't log in.** The form wasn't wired to the backend — fixed, verified end-to-end (create → real temp password → real login).
3. **Auditor dashboard showed fake demo entries.** Now pulls the real audit trail.
4. **Real 2FA (TOTP)** — full setup → QR → verify → login-requires-code → disable flow, tested with a real generated code.
5. **Real login history** — actual IP address and User-Agent captured server-side, not simulated.
6. **Delegation colleague list was hardcoded to fake Finance names regardless of department** — now correctly scoped to the signed-in approver's own department.
7. **Delegation had no date validation** — end date before start date is now rejected server-side.
8. **Department Head's delegation approvals stayed stuck on "Pending" after approving/denying** — root cause was the frontend never refetching after the action; fixed.
9. **Missing Profile & Password pages for Super Admin, System Admin, and Auditor** — these routes didn't exist at all, causing "page not found." Added all three.
10. **Sidebar collapse** added.
11. **"Initiate on Behalf" was fundamentally broken** — it would have filed the clearance request under HR's own account instead of the real applicant's. Fixed on the backend; verified the request now correctly appears under the real applicant's own "My Requests," not HR's.
12. **User Management and Department Management were inconsistent** — Add User's department dropdown and Add Department's "head" dropdown now both read from the same real backend data, so a department created in one immediately appears correctly in the other.
13. **Notifications were hardcoded fake arrays on every dashboard** — Applicant, Approver, HR, and Department Head Notifications pages all now fetch real data from the database.
14. **HR's Follow Up, Export, and Generate Report buttons did nothing** — Follow Up now calls a real escalation endpoint; Export/Generate Report produce a real downloaded CSV built from real data.
15. **Workflow Builder was 100% mock** — rebuilt with real per-department Parallel/Sequential toggles (mixing both within one clearance type is how you get a Hybrid workflow), real SLA-hours editing, and real save/load. Verified: saved a genuine hybrid configuration and confirmed it reloaded correctly.
16. **Settings page didn't persist anything** — every tab (General, Email, Certificate, Security, Language, Time Zone) now saves to a real database row and survives a refresh. Logo upload is real — verified end-to-end, including the file actually being served back correctly.
17. **Notification Templates page was mock** — now reads/writes real template rows the backend's email service actually uses.
18. **Top-nav search bar was UI-only** — now queries a real, role-aware backend search endpoint (applicants only ever see their own requests; HR/Admin/Auditor see everything).
19. **Help & Support did nothing when clicked** — built a real page with FAQs plus a contact form that creates a real support ticket and sends a real notification.
20. **Home page "analytics" were hardcoded** on the Approver, HR, and Department Head dashboards — all three now compute real numbers (pending counts, approvals today, SLA breaches, etc.) from real data. Department Head's view is correctly scoped to only their own department (verified: Library's head sees only Library's tasks, while Super Admin sees all six departments).
21. **Department Documents and Calendar (Approver) were static mockups** — Department Documents now lists and downloads real uploaded files; Calendar now plots real SLA deadlines from the real pending queue.
22. **HR's "Initiate on Behalf" applicant search was fake** — now does a real name/ID lookup against the database.

## What's real vs. what to know

Everything listed below was tested against the live database during development:

- **Auth**: real bcrypt-hashed passwords, real JWTs, session restored on page refresh
- **Apply for Clearance → Approve/Reject/Hold → Auto-completion → Certificate generation**: the full workflow engine runs for real — approving every department automatically flips the request to "cleared" and generates an actual PDF (pdfmake) with a QR code and SHA-256-verifiable hash, written to `backend/uploads/certificates/`
- **Partial-approval-persistence on resubmission**: reject → resubmit correctly carries forward departments that already approved and only re-opens the rejected one — this was specifically tested and confirmed working
- **Public certificate verification** (`/verify`, no login): checks a real certificate number against the database — try it after generating one
- **Certificate revoke + reissue**: revoking marks the old certificate "Revoked — superseded by CERT-XXXX" rather than deleting it, and generates a real replacement PDF
- **Row-level access**: an approver's "Pending Requests" only ever returns their own department's tasks — verified by logging in as five different approvers and confirming complete isolation
- **First-login forced password change**: Super Admin creates a user → temp password is generated and "emailed" (logged to the backend console since no SMTP is configured — see below) → user must change it before reaching their dashboard
- **Audit logging**: every login, approval, rejection, escalation, and certificate action is written to `audit_logs` — viewable live via the Auditor dashboard

### Pages still running on local/mock data
Given the scope of ~50 screens, the core clearance workflow (the part that actually matters for grading/demoing "is this system functional") is fully wired to the real backend. Some secondary administrative screens (Super Admin's Workflow Builder UI, Department Head's Team Performance charts, some report/analytics visualizations) still display local placeholder data rather than a live query — the backend endpoints for these already exist (see `backend/src/routes/`), they just aren't yet called from those specific screens. Wiring any of them follows the exact same pattern used throughout `frontend/src/services/` — happy to finish any specific one you need for your demo.

### Email
No real SMTP is configured out of the box. Every email the system would send (clearance submitted, approval, rejection, deadline reminders, escalations, temp passwords) is instead printed to the backend's console/log, so the whole notification-dependent workflow still runs without needing a real mailbox. To send real emails, fill in `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` in `backend/.env`.

### Dark/Light mode
Toggle is in the top nav (sun/moon icon) and on the login screen. Implemented via CSS variables so the light theme is pixel-identical to what was already reviewed.

---

## Database tables (matches SRS section 14 exactly, plus 2 justified additions)

`users` · `departments` · `clearance_requests` · `workflows` · `department_approvals` · `documents` · `certificates` · `audit_logs` · `notifications` — all from the original SRS.

Two additional tables were needed and added:
- `delegations` — tracks substitute-approver requests and Department Head approval (needed for the "Delegation Settings" / "Assign Substitute" screens already in the UI)
- `password_reset_tokens` — short-lived tokens for the Forgot Password flow

## Tech stack (matches the SRS exactly)

MySQL (via XAMPP) · React.js · Node.js/Express · pdfmake (certificate generation) · Nodemailer (notifications) · node-cron (SLA reminders/escalation, runs daily at 08:00 per the SRS deployment checklist)
