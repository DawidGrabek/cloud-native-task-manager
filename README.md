# Cloud native task manager - DevOps Task Manager

Complete DevOps demonstration project built with React, Node.js, PostgreSQL, Docker, and Kubernetes - **100% free tier compatible**.

## 🎯 Project Overview

This project demonstrates a full DevOps pipeline for a Task Management application using only free-tier cloud services and open-source tools.

### Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15-alpine
- **Containerization**: Docker + multi-stage builds
- **Orchestration**: k3s (lightweight Kubernetes)
- **CI/CD**: GitHub Actions (free for public repos)
- **Monitoring**: Grafana Cloud (free tier) - *Coming soon*
- **Container Registry**: GitHub Container Registry (free)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- k3s (for Kubernetes deployment)
- Git

### Kubernetes Deployment (k3s)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cloud-native-task-manager.git
   cd cloud-native-task-manager
   ```

2. **Deploy to k3s**
   ```bash
   ./build-and-deploy.sh
   ```

3. **Access the application**
   ```bash
   kubectl get services -n taskmanager
   ```
   - Frontend: http://<NODE_IP>:<NodePort>
   - Backend API: Internal only (backend-service:5000)

### Local Development with Docker Compose

1. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

## 📁 Project Structure

```
cloud-native-task-manager/
├── frontend/                    # React TypeScript app with NGINX
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API calls
│   │   ├── types/             # TypeScript definitions
│   │   └── App.tsx
│   ├── nginx.conf             # NGINX reverse proxy config
│   ├── Dockerfile             # Multi-stage build (Node + NGINX)
│   └── package.json
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── routes/            # API routes (/api/health, /api/tasks)
│   │   ├── models/            # Database models
│   │   ├── middleware/        # Express middleware
│   │   └── server.ts
│   ├── Dockerfile             # Node.js production image
│   └── package.json
├── k8s/                       # Kubernetes manifests
│   ├── namespace.yaml         # taskmanager namespace
│   ├── postgres-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── services.yaml
├── scripts/
│   ├── build-and-deploy.sh    # Full deployment script
│   ├── reload-k8s-image.sh    # Development helper
├── docker-compose.yml         # Local development
└── README.md
```

## 🛠 Technologies Used

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS for styling
- Axios for API calls
- React Hook Form for forms
- NGINX as reverse proxy

### Backend
- Node.js + Express + TypeScript
- PostgreSQL with pg driver
- JWT ready for authentication
- CORS enabled
- Health check endpoints

### DevOps & Infrastructure
- **Docker**: Multi-stage builds (< 60MB frontend, < 150MB backend)
- **k3s**: Lightweight Kubernetes for local/edge deployment
- **Kubernetes**: Deployments, Services, LoadBalancer
- **Container Images**: Optimized Alpine-based images

## 🎨 Current Features

- ✅ Create, update, delete tasks
- ✅ Task status management (Todo, In Progress, Done)
- ✅ Responsive design with Tailwind CSS
- ✅ API health checks (`/api/health`)
- ✅ Database connection monitoring
- ✅ Docker multi-stage containerization
- ✅ Kubernetes deployment with k3s
- ✅ NGINX reverse proxy
- ✅ Automated deployment scripts

## 🔧 Development Commands

```bash
# Quick deployment
./build-and-deploy.sh                    # Deploy full stack to k3s

# Development helpers  
./reload-k8s-image.sh frontend          # Update only frontend
./reload-k8s-image.sh backend           # Update only backend
./stop-app.sh                           # Stop application

# Manual Kubernetes
kubectl get pods -n taskmanager         # Check status
kubectl logs -n taskmanager -l app=backend  # View backend logs
kubectl delete namespace taskmanager    # Clean deployment

# Docker maintenance
docker image prune -f                   # Clean dangling images
docker system df                        # Check disk usage

# Backend development
cd backend && npm run dev               # Start development server
npm run build && npm run test          # Build and test

# Frontend development  
cd frontend && npm run dev              # Start Vite dev server
npm run build                          # Build for production
```

## 📊 Monitoring & Health Checks

- **Application health**: `/api/health`
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "services": {
        "database": { "healthy": true, "responseTime": 3 },
        "api": { "healthy": true, "responseTime": 475.893221 }
      },
      "uptime": 59.100750194
    }
  }
  ```
- **Database health**: Included in `/api/health`
- **Kubernetes probes**: Liveness and readiness probes configured

## 🌐 Upcoming Features

### Next Phase: CI/CD Pipeline
- **GitHub Actions** for automated builds
- **Automated testing** (unit, integration, e2e)
- **Multi-environment deployments** (dev/staging/prod)
- **Container scanning** and security checks

### Future Phases:
- **Authentication**: JWT + refresh tokens
- **Monitoring**: Prometheus + Grafana stack  
- **Cloud deployment**: AWS Free Tier / Oracle Cloud Always Free
- **Infrastructure as Code**: Terraform/Helm

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `./build-and-deploy.sh`
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Dawid Grabek** - Full-stack Developer specializing in DevOps

- Experience: React, Node.js, TypeScript, Docker, Kubernetes
- Focus: Cloud-native applications, CI/CD, monitoring
- GitHub: [@dawidgrabek](https://github.com/DawidGrabek)
- LinkedIn: [Dawid Grabek](https://www.linkedin.com/in/dawid-grabek/)

---

_This project demonstrates modern DevOps practices using k3s and entirely free-tier services, perfect for portfolio and learning purposes._