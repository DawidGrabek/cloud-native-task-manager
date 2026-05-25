# Cloud Native Task Manager

A production-grade, cloud-native task management application showcasing modern DevOps practices. Built as a full-stack monorepo with React, Node.js, PostgreSQL, Docker, Kubernetes, and a complete observability stack.

![CI/CD Pipeline](https://github.com/DawidGrabek/cloud-native-task-manager/actions/workflows/ci.yml/badge.svg)

## Project Overview

This project demonstrates an end-to-end DevOps pipeline — from local development through CI/CD to Kubernetes deployment — using only free-tier services and open-source tools.

### Architecture

```
                    ┌──────────────────── CI/CD ────────────────────┐
                    │  Commitlint → Audit → Lint → Build → Test     │
                    │                    │                          │
                    │            Docker Build & Push                │
                    └────────────────────┬──────────────────────────┘
                                         │ Docker Hub
                    ┌────────────────────▼──────────────────────────┐
                    │                Application                    │
                    │                                               │
                    │  React + NGINX ──/api/*──▶ Node.js + Express  │
                    │  (frontend)                (backend)          │
                    │                               │               │
                    │                     ┌─────────┴────────┐      │
                    │                     ▼                  ▼      │
                    │              PostgreSQL 15         Redis 7    │
                    └───────────────────────────────────────────────┘
                                         │
                    ┌────────────────────▼──────────────────────────┐
                    │               Observability                   │
                    │                                               │
                    │  Prometheus ◀── metrics ── Backend            │
                    │      │                       │                │
                    │      ▼                     logs               │
                    │   Grafana ◀── Loki ◀── Promtail               │
                    │      ▲                                        │
                    │      └── Node Exporter (host metrics)         │
                    └───────────────────────────────────────────────┘
```

### Tech Stack

| Layer              | Technology                                              |
| ------------------ | ------------------------------------------------------- |
| **Frontend**       | React 19, TypeScript, Vite, Tailwind CSS 4              |
| **Backend**        | Node.js 18, Express, TypeScript, Joi validation         |
| **Database**       | PostgreSQL 15 (Alpine), pgcrypto UUIDs                  |
| **Auth**           | JWT (jsonwebtoken), bcrypt password hashing              |
| **Testing**        | Jest + Supertest (backend), Vitest + Testing Library (frontend) |
| **Containerization** | Docker multi-stage builds, Docker Compose             |
| **Orchestration**  | Kubernetes (k3s), Deployments, Services, Ingress        |
| **CI/CD**          | GitHub Actions (lint → audit → test → build → push)     |
| **Monitoring**     | Prometheus, Grafana, Node Exporter                      |
| **Logging**        | Loki, Promtail                                          |
| **Code Quality**   | ESLint, Prettier, Commitlint (Conventional Commits), Husky |

## Quick Start

### Prerequisites

- Node.js 20+ (LTS)
- Docker & Docker Compose
- Git

### Local Development (Docker Compose)

```bash
# 1. Clone the repository
git clone https://github.com/DawidGrabek/cloud-native-task-manager.git
cd cloud-native-task-manager

# 2. Start the full stack (app + monitoring)
docker compose up -d

# 3. Access the application
#    Frontend:    http://localhost:5173
#    Backend API: http://localhost:5000
#    Grafana:     http://localhost:3000  (admin / admin123)
#    Prometheus:  http://localhost:9090
```

A demo user is automatically seeded:
- **Email:** `demo@taskmanager.com`
- **Password:** `demo123`

### Native Development (without Docker)

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (in a separate terminal)
cd frontend && npm install && npm run dev
```

### Kubernetes Deployment (k3s)

```bash
# Build images and push to Docker Hub
./scripts/k8s-build-push.sh

# Apply all K8s manifests (app + monitoring)
./scripts/k8s-deploy.sh

# Check status
kubectl get pods -n taskmanager
kubectl get pods -n monitoring

# Tear down
./scripts/k8s-clean.sh
```

## Features

- **Task CRUD** — Create, read, update, delete tasks with title, description, priority, and status
- **Task statuses** — `todo` → `in-progress` → `done` workflow
- **Priority levels** — Low, Medium, High with visual indicators
- **User authentication** — Register / Login with JWT tokens and bcrypt hashing
- **Input validation** — Joi schema validation on all API endpoints
- **Security hardening** — Helmet, CORS, rate limiting, non-root Docker user
- **Health checks** — `/api/health` with database connectivity and uptime monitoring
- **Prometheus metrics** — HTTP request duration, task operations counters via `prom-client`
- **Structured logging** — Winston JSON logger with Loki aggregation
- **Responsive UI** — Tailwind CSS with mobile-friendly design

## Project Structure

```
cloud-native-task-manager/
├── frontend/                        # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/              # UI components (Header, LoginForm, TaskCard, TaskForm, TaskList)
│   │   ├── services/                # Axios API client
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── __tests__/               # Vitest + Testing Library tests (53 tests)
│   │   └── App.tsx                  # Main application component
│   ├── nginx.conf                   # NGINX reverse proxy (SPA fallback + /api proxy)
│   ├── Dockerfile                   # Multi-stage: Node build → NGINX serve
│   └── vite.config.ts               # Vite + Vitest + tsconfig paths
├── backend/                         # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/                  # API routes (auth, tasks, health)
│   │   ├── middleware/              # Auth (JWT), error handler, Prometheus metrics
│   │   ├── database/               # PostgreSQL connection pool
│   │   ├── utils/                   # Winston structured logger
│   │   ├── __tests__/               # Jest + Supertest tests (53 tests)
│   │   ├── app.ts                   # Express app factory (testable without server)
│   │   └── server.ts                # Server bootstrap with DB init
│   ├── Dockerfile                   # Multi-stage: build → production (dumb-init, non-root)
│   └── jest.config.js               # Jest + ts-jest + path aliases
├── db/
│   └── init.sql                     # Schema, indexes, triggers, demo seed data
├── k8s/
│   ├── namespace.yaml               # taskmanager namespace
│   ├── app/                         # Backend, Frontend, Postgres, Ingress manifests
│   └── monitoring/                  # Prometheus, Grafana, Node Exporter manifests
├── docker-monitoring/
│   ├── prometheus/                  # Prometheus scrape config
│   ├── grafana/                     # Datasources + dashboard provisioning
│   ├── loki/                        # Loki config
│   └── promtail/                    # Promtail → Loki pipeline
├── scripts/
│   ├── k8s-build-push.sh            # Build & push Docker images to Docker Hub
│   ├── k8s-deploy.sh                # Apply all K8s manifests
│   ├── k8s-clean.sh                 # Tear down K8s namespaces
│   └── k8s-print-manifests.sh       # Debug: print all K8s resources
├── .github/workflows/ci.yml         # CI/CD pipeline definition
├── .commitlintrc.js                 # Conventional Commits enforcement
├── .husky/                          # Git hooks (commit-msg → commitlint)
└── docker-compose.yml               # Full local stack (9 services)
```

## CI/CD Pipeline

The GitHub Actions pipeline runs on every push/PR to `main`:

```
  ┌─────────────────────────────────────────────────────────────┐
  │                        CI/CD Pipeline                       │
  ├─────────────┬───────────────────────────┬───────────────────┤
  │ commitlint  │           test            │ docker-build-push │
  │             │                           │   (main only)     │
  │ Conventional│ Backend:                  │                   │
  │ Commits     │  npm ci → audit →         │ Login Docker Hub  │
  │ check       │  prettier → lint →    ───▶│ Build & tag       │
  │             │  build → jest (53)        │ Push :latest      │
  │             │                           │   + :sha          │
  │             │ Frontend:                 │                   │
  │             │  npm ci → audit →         │                   │
  │             │  prettier → lint →        │                   │
  │             │  build → vitest (53)      │                   │
  └─────────────┴───────────────────────────┴───────────────────┘
```

**Required GitHub Secrets:**
- `DOCKER_USERNAME` — Docker Hub login
- `DOCKER_PASSWORD` — Docker Hub access token

## Testing

The project has **106 tests** total across both applications.

```bash
# Run backend tests (Jest, 53 tests)
cd backend && npm test

# Run frontend tests (Vitest, 53 tests)
cd frontend && npm test
```

**Backend test suites:** Auth, Tasks (CRUD), Health, Middleware (JWT)
**Frontend test suites:** App, LoginForm, TaskCard, TaskForm, TaskList, API service

## API Endpoints

| Method   | Endpoint                | Auth | Description                  |
| -------- | ----------------------- | ---- | ---------------------------- |
| `GET`    | `/api/health`           | ✗    | Health check + DB status     |
| `POST`   | `/api/auth/register`    | ✗    | Register a new user          |
| `POST`   | `/api/auth/login`       | ✗    | Login, returns JWT           |
| `GET`    | `/api/auth/profile`     | ✓    | Get authenticated user info  |
| `GET`    | `/api/tasks`            | ✓    | List user's tasks            |
| `GET`    | `/api/tasks/:id`        | ✓    | Get task by ID               |
| `POST`   | `/api/tasks`            | ✓    | Create a new task            |
| `PUT`    | `/api/tasks/:id`        | ✓    | Update a task                |
| `DELETE` | `/api/tasks/:id`        | ✓    | Delete a task                |
| `GET`    | `/metrics`              | ✗    | Prometheus metrics endpoint  |

**Health check response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "database": { "healthy": true, "responseTime": 3 },
      "api": { "healthy": true, "responseTime": 475.89 }
    },
    "uptime": 59.10
  }
}
```

## Monitoring & Observability

| Service          | URL (Docker Compose)    | Purpose                              |
| ---------------- | ----------------------- | ------------------------------------ |
| **Grafana**      | `http://localhost:3000`  | Dashboards and visualization         |
| **Prometheus**   | `http://localhost:9090`  | Metrics collection and querying      |
| **Loki**         | `http://localhost:3100`  | Log aggregation                      |
| **Node Exporter**| `http://localhost:9100`  | Host machine metrics (CPU, RAM, I/O) |

Grafana is auto-provisioned with Prometheus and Loki datasources.

## Development Commands

```bash
# Docker Compose
docker compose up -d                        # Start all services
docker compose down                         # Stop all services
docker compose logs -f backend-service      # Follow backend logs

# Kubernetes
./scripts/k8s-build-push.sh                 # Build & push images
./scripts/k8s-deploy.sh                     # Deploy to cluster
./scripts/k8s-clean.sh                      # Remove from cluster
kubectl get pods -n taskmanager             # Check app pods
kubectl logs -n taskmanager -l app=backend  # View backend logs

# Backend
cd backend && npm run dev                   # Start dev server (hot reload)
cd backend && npm run build                 # Compile TypeScript
cd backend && npm test                      # Run Jest tests
cd backend && npm run lint                  # Run ESLint

# Frontend
cd frontend && npm run dev                  # Start Vite dev server
cd frontend && npm run build                # Build for production
cd frontend && npm test                     # Run Vitest tests
cd frontend && npm run lint                 # Run ESLint
```
