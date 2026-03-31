# SmartSite Local Run And Full Workflow Test Guide

This document is for teammates who need to run SmartSite locally and validate a full business workflow.

## 1. Scope

This guide covers:

1. Local run without Docker
2. Full workflow testing: create company -> assign director -> assign project manager -> create and validate project flow

## 2. Prerequisites

Install:

- Node.js 20+
- npm 10+
- MongoDB running locally on port 27017
- PostgreSQL running locally on port 5432
- Keycloak extracted locally (for example keycloak-24.0.2)

Check tools:

```bash
node -v
npm -v
```

## 3. Local Services Required

Before starting frontend/backend, make sure these services are up:

- MongoDB at localhost:27017
- PostgreSQL at localhost:5432
- Keycloak at localhost:8080

### 3.1 Start Keycloak locally (Windows)

Open terminal in your Keycloak folder and run:

```bash
bin\kc.bat start-dev
```

Then open:

- http://localhost:8080

Default local admin often is:

- username: admin
- password: admin

If your admin account is different, use your own values.

## 4. Backend Environment File

Create:

- smartsite-backend/smartsite-backend/.env

Use this template:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin

REALM=smartsite-realm
CLIENT_ID=smartsite-backend
CLIENT_SECRET=REPLACE_WITH_KEYCLOAK_CLIENT_SECRET

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=smartsite
POSTGRES_PASSWORD=smartsite
POSTGRES_DB=smartsite

RECAPTCHA_SECRET_KEY=REPLACE_WITH_RECAPTCHA_SECRET

GMAIL_USER=
GMAIL_PASSWORD=

SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_EMAIL=admin@smartsite.com
SUPER_ADMIN_PASSWORD=Admin@123

DIRECTOR_USERNAME=director
DIRECTOR_EMAIL=director@smartsite.com
DIRECTOR_PASSWORD=Director@123

PROJECT_MANAGER_USERNAME=project_manager
PROJECT_MANAGER_EMAIL=pm@smartsite.com
PROJECT_MANAGER_PASSWORD=ProjectManager@123

QHSE_MANAGER_USERNAME=qhse_manager
QHSE_MANAGER_EMAIL=qhse@smartsite.com
QHSE_MANAGER_PASSWORD=QhseManager@123

CLIENT_USERNAME=client
CLIENT_EMAIL=client@smartsite.com
CLIENT_PASSWORD=Client@123
```

## 5. Frontend Environment File

Create or update:

- smartsite-frontend/.env

```env
VITE_API_URL=http://localhost:3000
VITE_RECAPTCHA_SITE_KEY=REPLACE_WITH_RECAPTCHA_SITE_KEY
```

Important: login requires CAPTCHA token. If the site key is invalid or missing, login will not continue.

## 6. Keycloak One-Time Configuration

In Keycloak admin console:

1. Create realm: smartsite-realm
2. Create client: smartsite-backend
3. Enable client authentication and copy secret into backend CLIENT_SECRET
4. Create these realm roles exactly:
   - SUPER_ADMIN
   - DIRECTOR
   - PROJECT_MANAGER
   - QHSE_MANAGER
   - CLIENT

If these roles are missing, seeded user role assignment fails during backend initialization.

## 7. Run Locally (No Docker)

### 7.1 Start backend

```bash
cd smartsite-backend/smartsite-backend
npm install
npm run start:dev
```

Expected backend URL:

- http://localhost:3000

### 7.2 Start frontend

In a new terminal:

```bash
cd smartsite-frontend
npm install
npm run dev
```

Expected frontend URL:

- http://localhost:5173

## 8. Test Accounts

Available credentials in this repo:

- admin / Admin@123
- director@smartsite.com / Director@123
- pm@smartsite.com / ProjectManager@123
- qhse@smartsite.com / QhseManager@123
- client@smartsite.com / Client@123

Notes:

- Login may accept username or email depending on account data.
- Super admin auto-seeding requires SUPER_ADMIN_PASSWORD in backend env.

## 9. Full Business Workflow Test (Main Scenario)

This is the end-to-end workflow you asked for.

### 9.1 Super admin: create company and assign director

1. Login as super admin.
2. Open super admin area.
3. Create a new company with clear test name, for example Company E2E Local 01.
4. Assign a director user to that company.
5. Save and confirm success message.
6. Verify company appears in company list with assigned director.

Expected result:

- Company exists and is linked to the selected director.

### 9.2 Super admin: assign project manager to same company

1. Stay as super admin.
2. Open company assignment page.
3. Assign project manager to the same company.
4. Save assignment.

Expected result:

- Project manager is attached to that company.

### 9.3 Director: create strategic vision for assigned company

1. Logout and login as director.
2. Open director section.
3. Check assigned company is visible.
4. Create strategic vision (budget, dates, KPIs).
5. Save and verify values persist after page refresh.

Expected result:

- Strategic vision is stored for the assigned company.

### 9.4 Project manager: create and submit project

1. Logout and login as project manager.
2. Open project manager section.
3. Create a project for the same company.
4. Add required fields (name, code if needed, budget, start/end dates).
5. Submit project for validation.

Expected result:

- Project status moves from draft to submitted for validation.

### 9.5 Client: validate project or milestones

1. Logout and login as client.
2. Open client page.
3. Open the submitted project or milestone.
4. Approve or reject with comment.

Expected result:

- Validation status updates correctly.
- Comment is visible in relevant history/details.

### 9.6 Director and PM: verify feedback loop

1. Login again as director/project manager.
2. Confirm validation result is visible.
3. If rejected, update and resubmit.
4. If approved, verify final status is reflected across views.

Expected result:

- Workflow transitions are consistent across all role dashboards.

## 10. Access Control Checks

Run these quick checks during the same session:

1. Director must not access super admin pages.
2. Client must not access project manager pages.
3. Unauthenticated user opening protected URL should be redirected to login.

Expected result:

- Role-based route protection always enforced.

## 11. Activity Log Checks

Verify that activity logs capture at least:

- Login
- Logout
- Company creation
- User assignments
- Project submit
- Validation action

Expected result:

- Each major action appears with status and actor.

## 12. Automated Tests (Local)

### 12.1 Backend

```bash
cd smartsite-backend/smartsite-backend
npm run lint
npm run test
npm run test:e2e
npm run test:cov
```

### 12.2 Frontend

```bash
cd smartsite-frontend
npm run lint
npm run test
npm run build
```

## 13. Troubleshooting

### Problem: cannot login due to CAPTCHA

Cause: missing or invalid reCAPTCHA keys.

Fix:

- Set VITE_RECAPTCHA_SITE_KEY in frontend env
- Set RECAPTCHA_SECRET_KEY in backend env
- Use a valid site/secret pair from same reCAPTCHA project

### Problem: backend errors when assigning roles

Cause: Keycloak realm roles do not exist.

Fix: create all required roles in section 6.

### Problem: auth endpoints fail

Cause: REALM, CLIENT_ID, CLIENT_SECRET mismatch between backend env and Keycloak.

Fix: align backend env with Keycloak client settings exactly.

## 14. Suggested QA Evidence To Share

After execution, share:

1. Screenshots for each role step
2. Final status of created company and project
3. Activity log screenshots
4. Test command outputs for backend and frontend
