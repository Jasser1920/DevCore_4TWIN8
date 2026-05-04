# SmartSite DevOps Step By Step (Docker on WSL2 + Jenkins + SonarQube + Kubernetes)

This guide keeps the same rollout sequence we discussed, with one required change:

- Each database must run in a separate container.

## 0. Target Outcome

By the end, you will have:

- Docker Engine running inside WSL2 (without Docker Desktop)
- Frontend and backend containerized
- Separate database containers
- Keycloak in its own container, with its own database container
- AI model service in its own container
- Jenkins CI/CD pipeline
- SonarQube quality gate integrated in CI
- Kubernetes deployment for staging/production-style flow

## 1. Define Final Architecture (Before Installation)

Lock the target architecture first to avoid rework.

Core services:

- Frontend container (Vite app served by nginx or similar)
- Backend container (NestJS API)
- Keycloak container (separate service, not embedded in backend)
- AI model container (separate service, not embedded in backend)
- Database container A: PostgreSQL for app data
- Database container B: MongoDB (activity logs or document data)
- Database container C: PostgreSQL dedicated to Keycloak (recommended)
- Jenkins (CI/CD)
- SonarQube
- Kubernetes cluster

Minimum environments:

- Local Dev (Docker Compose on WSL2)
- Staging (Kubernetes namespace)
- Production (Kubernetes namespace or separate cluster)

Exit criteria:

- Architecture is written in docs and accepted by your team.

## 2. Install Docker Engine in WSL2 (No Docker Desktop)

Use Ubuntu (or your WSL distro) and install Docker Engine natively.

### 2.1 Install dependencies

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
```

### 2.2 Add Docker repository and install

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2.3 Start and enable Docker

```bash
sudo service docker start
sudo usermod -aG docker $USER
newgrp docker
```

### 2.4 Verify

```bash
docker --version
docker compose version
docker run --rm hello-world
```

Exit criteria:

- Docker commands run from WSL2 terminal with no Docker Desktop dependency.

## 3. Containerize Backend and Frontend

You already have Dockerfiles, so validate and harden them.

Checklist for backend image:

- Multi-stage build (builder and runtime)
- Runtime image is slim
- Only production dependencies in final image
- Health endpoint available (for Kubernetes probes)
- Config read from env vars (not hardcoded)

Checklist for frontend image:

- Build static assets in Node stage
- Serve static assets in nginx stage
- API base URL configurable (env or runtime config strategy)

Exit criteria:

- `docker build` succeeds for frontend and backend.

## 4. Local Runtime Validation (Containers Only)

Before Jenkins/Kubernetes, ensure application behavior is correct in containers.

Verify:

- Frontend can authenticate against backend
- Backend can connect to PostgreSQL and MongoDB
- Keycloak integration is functional
- Core business flow still works

Use seed/test accounts to validate role flows.

Exit criteria:

- End-to-end business flow works with containers.

## 5. Docker Compose With Strict DB Separation

This is your requested change and should be enforced now.

## 5.1 Required separate data containers

- `postgres_app`: PostgreSQL used only by SmartSite backend
- `mongo_app`: MongoDB used only by SmartSite backend document/log collections
- `postgres_keycloak`: PostgreSQL used only by Keycloak
- `keycloak`: separate Keycloak application container
- `ai_service`: separate container for your future AI model service

Do not share one PostgreSQL container between app and Keycloak in this setup, and do not run Keycloak or the AI service inside the backend container.

### 5.2 Suggested compose service layout

- frontend
- backend
- keycloak
- postgres_app
- mongo_app
- postgres_keycloak
- optional: sonarqube (for local quality checks)

### 5.3 Network and volume rules

- Put all services on one dedicated internal Docker network
- Use separate named volumes:
  - `pg_app_data`
  - `mongo_app_data`
  - `pg_keycloak_data`
- Never mount one DB volume into another DB container

### 5.4 Environment mapping example

Backend env should point only to:

- `POSTGRES_HOST=postgres_app`
- `MONGO_HOST=mongo_app` (or full URI)

Keycloak should point only to:

- `KC_DB=postgres`
- `KC_DB_URL_HOST=postgres_keycloak`

Exit criteria:

- All three databases are up in independent containers and app/keycloak connect to the correct one.

## 6. Choose and Configure Container Registry

Pick one registry:

- Docker Hub
- GitHub Container Registry
- Private registry

Create repositories for:

- smartsite-backend
- smartsite-frontend

Use immutable tags in CI:

- commit SHA
- release tag
- optional branch tag

Exit criteria:

- You can push and pull both images from Jenkins machine.

## 7. Install and Configure Jenkins

Run Jenkins in Docker or dedicated VM.

Install plugins:

- Git
- Pipeline
- Credentials Binding
- Docker Pipeline
- SonarQube Scanner

Configure credentials:

- Git repo access token
- Registry credentials
- SonarQube token
- Kubernetes kubeconfig or service account token

Exit criteria:

- Jenkins can clone repo and access all required credentials.

## 8. Install and Configure SonarQube

Run SonarQube and create project(s) for:

- backend
- frontend

Set quality gate thresholds (example):

- No new blocker/critical issues
- Coverage on new code >= 70%
- Duplication on new code <= 3%

Integrate scanner in Jenkins pipeline.

Exit criteria:

- Pipeline fails when quality gate fails.

## 9. Build CI Pipeline First (No Deploy Yet)

Pipeline stages:

1. Checkout
2. Install dependencies
3. Lint
4. Unit tests
5. SonarQube scan
6. Build backend and frontend images
7. Container vulnerability scan (Trivy)
8. Push images to registry

Stop pipeline if any stage fails.

Exit criteria:

- A commit produces versioned images only when all checks pass.

## 10. Add Image and Dependency Security Scanning

Use Trivy or equivalent to scan:

- Backend image
- Frontend image
- Dependency lockfiles

Recommended policy:

- Block on critical vulnerabilities
- Warn on high vulnerabilities during first iteration

Exit criteria:

- Security stage is enforced and visible in Jenkins results.

## 11. Kubernetes Cluster Setup

Start with one non-production cluster for staging.

Good choices:

- k3s (lightweight)
- kind (good for local lab)
- managed cluster later (AKS/EKS/GKE)

Install baseline components:

- ingress-nginx
- metrics-server
- cert-manager (if HTTPS needed)

Exit criteria:

- Cluster is reachable from Jenkins and has required controllers.

## 12. Deploy With Helm (Preferred)

Create a chart (or separate charts) with values per environment.

Required objects:

- Deployment (frontend)
- Deployment (backend)
- Service (frontend)
- Service (backend)
- Ingress
- ConfigMap
- Secret
- HPA (optional phase 2)

Probe setup:

- readiness probe on backend health endpoint
- liveness probe on backend health endpoint

Exit criteria:

- One Helm command deploys full app stack to staging namespace.

## 13. Wire Jenkins CD to Kubernetes

After successful CI and image push:

1. Update image tags in Helm values
2. Deploy to staging namespace
3. Run smoke tests
4. Optionally require manual approval
5. Deploy to production namespace

Keep rollout strategy safe:

- Rolling updates
- Quick rollback command documented

Exit criteria:

- End-to-end commit-to-deploy works reliably.

## 14. Secret and Config Management

Rules:

- Never hardcode secrets in repository
- Never bake secrets into images
- Store CI secrets in Jenkins credentials
- Store runtime secrets in Kubernetes Secrets

Recommended later upgrade:

- External secrets manager integration

Exit criteria:

- Rotating a secret does not require image rebuild.

## 15. Ingress and TLS

Expose services using ingress-nginx.

Add TLS via cert-manager for:

- frontend domain
- backend API domain
- Keycloak domain (if external)

Exit criteria:

- HTTPS access works and certificates auto-renew.

## 16. Observability (Required Before Production)

Add metrics and logs:

- Prometheus + Grafana for metrics
- Loki or ELK for centralized logs

Track at minimum:

- API latency
- Error rate
- Pod restarts
- CPU/memory per service

Exit criteria:

- You can troubleshoot app failures without SSHing into nodes.

## 17. Rollback and Release Safety

Prepare rollback playbook:

- Helm rollback command
- Kubernetes rollout undo command
- Known good image tags list

Deployment safety:

- readiness/liveness probes
- resource requests/limits
- max unavailable/max surge tuned

Exit criteria:

- Failed release can be reverted in minutes.

## 18. Environment Separation

Keep config and secrets separated for:

- dev
- staging
- production

Use different values files and namespaces.

Exit criteria:

- Deploying to staging cannot overwrite production config.

## 19. Documentation and Runbooks

Document all operational flows:

- Local container startup
- CI pipeline stages and failure interpretation
- Staging/production deployment steps
- Rollback steps
- Credential rotation process

Exit criteria:

- Another team member can execute the pipeline and deployment without ad-hoc knowledge.

## 20. Execution Order (Keep This Sequence)

Use this exact sequence:

1. Docker on WSL2
2. Containerize app
3. Local compose validation
4. Jenkins CI
5. SonarQube gate
6. Registry push
7. Kubernetes deployment
8. Helm, ingress, secrets, monitoring

## Appendix A: Suggested Pipeline Gates

Recommended mandatory gates before deploy:

- Lint pass
- Tests pass
- SonarQube quality gate pass
- No critical image vulnerabilities
- Image push success

Recommended optional gates:

- Manual approval for production
- Smoke test pass in staging

## Appendix B: Separation Rule (Final)

Your required policy is valid and production-friendly:

- One container per database engine instance
- Separate volumes per database container
- Distinct credentials per database
- Distinct backup strategy per database

This reduces blast radius and simplifies recovery when one data service has an incident.
