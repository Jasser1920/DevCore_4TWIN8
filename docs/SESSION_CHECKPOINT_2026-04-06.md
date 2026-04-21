# SmartSite DevOps Session Checkpoint

Date: 2026-04-06
Repository: DevCore_4TWIN8
Branch: develop

## Goal Of Session

Prepare local infra on WSL Docker Engine (not Docker Desktop) with separated containers for:

- frontend
- backend
- keycloak
- postgres_app
- postgres_keycloak
- mongodb

And validate auth integration for login flow.

## What Was Completed

### Step 1: Local Infra Startup On WSL

Completed.

Results:

- Stack successfully runs from WSL using docker compose.
- All required containers are up.
- Endpoints reachable:
  - Keycloak: http://localhost:8081
  - Frontend: http://localhost:5173
  - Backend reachable on http://localhost:3000 (root returns 404 which is acceptable for this API).

### Step 2: Keycloak Setup + Backend Auth Validation

Completed.

Results:

- Realm configured: smartsite-realm
- Client configured: smartsite-backend (confidential client)
- Backend env updated with current client secret
- Login validation passed for:
  - admin / Admin@123
  - director / Director@123
  - project_manager / ProjectManager@123

## Files Changed In This Session

- smartsite-backend/smartsite-backend/src/app.module.ts
- smartsite-backend/smartsite-backend/Dockerfile
- smartsite-backend/smartsite-backend/.env
- smartsite-infra/docker-compose.yml
- docs/DEVOPS_STEP_BY_STEP.md

## Key Technical Changes

1. MongoDB connection in backend is now env-driven

- app.module.ts now uses MONGODB_URI with localhost fallback.

2. Compose split for separated services

- postgres_app for backend relational data
- postgres_keycloak for Keycloak data
- mongodb for backend document data
- keycloak as separate service

3. Backend runtime container env overrides added in compose

- backend now points to service names inside compose network (not localhost).

4. Backend image build reliability fix

- Dockerfile install step uses npm install --legacy-peer-deps to bypass peer resolution conflict during image build.

5. Compose resilience improvements

- restart policy added for backend, frontend, keycloak.

6. Env parse fix

- invalid // comment in backend .env changed to # comment so compose env parsing works.

## Current Known Warnings / Notes

- Keycloak host port is exposed on 8081 (8080 is occupied by Oracle listener on this machine).
- Backend startup can show temporary Keycloak connection refused if Keycloak is still booting. Services recover once Keycloak is ready.
- Backend init may log 409 for creating users if users already exist in Keycloak. This is expected on repeated runs.

## Resume Plan For Next Session

Next planned item: Step 3 (stabilization and clean repeatability).

Step 3 target:

1. Optimize build context speed (add or improve .dockerignore where needed)
2. Remove obsolete compose version warning
3. Run clean restart proof:
   - docker compose down
   - docker compose up -d
   - verify all services up and login still works

## First Commands To Run Tomorrow

From PowerShell:

1. Start stack from WSL docker engine

wsl -d Ubuntu -- bash -lc 'cd /mnt/c/Users/nahal/Desktop/smartsite/DevCore_4TWIN8/smartsite-infra ; docker compose up -d'

2. Verify containers

wsl -d Ubuntu -- bash -lc 'cd /mnt/c/Users/nahal/Desktop/smartsite/DevCore_4TWIN8/smartsite-infra ; docker compose ps'

3. Quick endpoint check

- http://localhost:8081
- http://localhost:3000
- http://localhost:5173

4. Quick login check script

$tests = @(@{u='admin';p='Admin@123'}, @{u='director';p='Director@123'}, @{u='project_manager';p='ProjectManager@123'})
foreach ($t in $tests) {
  $body = @{ username = $t.u; password = $t.p } | ConvertTo-Json
  try {
    $resp = Invoke-RestMethod -Uri 'http://localhost:3000/auth/login' -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 20
    if ($resp.access_token) { Write-Output "$($t.u) LOGIN_OK" } else { Write-Output "$($t.u) LOGIN_NO_TOKEN" }
  } catch {
    if ($_.ErrorDetails.Message) { Write-Output "$($t.u) LOGIN_FAIL $($_.ErrorDetails.Message)" } else { Write-Output "$($t.u) LOGIN_FAIL $($_.Exception.Message)" }
  }
}

## How To Continue With Copilot Tomorrow

Send this file and say:

Resume from checkpoint step 3 and continue approval-based workflow (plan, approve, execute, test, next).

## Security Reminder

This checkpoint references operational credentials used in local dev flow. Keep it private and do not share publicly.
