# Cloud native task manager - DevOps Task Manager

Complete DevOps demonstration project built with React, Node.js, PostgreSQL, Docker, and Kubernetes - **100% free tier compatible**.

## 🎯 Project Overview

This project demonstrates a full DevOps pipeline for a Task Management application using only free-tier cloud services and open-source tools.

### Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Containerization**: Docker + Docker Compose
- **Orchestration**: k3s (local) / AWS ECS (free tier)
- **CI/CD**: GitHub Actions (free for public repos)
- **Monitoring**: Grafana Cloud (free tier)
- **Container Registry**: GitHub Container Registry (free)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/zero-cost-stack.git
   cd zero-cost-stack
   ```

2. **Start with Docker Compose**

   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

### Manual Setup (Development)

1. **Backend setup**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend setup**

   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Database setup**
   ```bash
   docker run -d --name postgres \
     -e POSTGRES_DB=taskmanager \
     -e POSTGRES_USER=admin \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 postgres:15-alpine
   ```

## 📁 Project Structure

```
cloud-native-task-manager/
├── frontend/                 # React TypeScript app
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API calls
│   │   ├── types/          # TypeScript definitions
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Express middleware
│   │   └── server.ts
│   ├── Dockerfile
│   └── package.json
├── database/               # Database scripts
│   └── init.sql
├── docker/                # Docker configurations
├── docker-compose.yml     # Local development
└── README.md
```

## 🛠 Technologies Used

### Frontend

- React 18 + TypeScript
- Tailwind CSS for styling
- Axios for API calls
- React Hook Form for forms

### Backend

- Node.js + Express + TypeScript
- PostgreSQL with pg driver
- bcrypt for password hashing
- JWT for authentication
- CORS enabled

### DevOps

- Docker multi-stage builds (< 500MB images)
- Docker Compose for local development
- GitHub Actions for CI/CD
- k3s for local Kubernetes
- Terraform for IaC

## 🎨 Features

- ✅ Create, update, delete tasks
- ✅ Task status management (Todo, In Progress, Done)
- ✅ User authentication (JWT)
- ✅ Responsive design
- ✅ API health checks
- ✅ Database migrations
- ✅ Docker containerization
- ✅ CI/CD pipeline ready

## 🔧 Development Commands

```bash
# Backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run test         # Run tests
npm run lint         # ESLint check

# Frontend
npm start            # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # ESLint check

# Docker
docker-compose up --build    # Build and start all services
docker-compose down          # Stop all services
docker system prune -f       # Clean up Docker cache
```

## 📊 Monitoring & Health Checks

- **Backend health**: GET /api/health
- **Database health**: GET /api/health/db
- **Prometheus metrics**: GET /api/metrics (if enabled)

## 🌐 Deployment

This project is designed for zero-cost deployment using:

- **AWS Free Tier**: ECS + ECR + RDS
- **Oracle Cloud Always Free**: 4 vCPU + 24GB RAM forever
- **GitHub Actions**: Unlimited CI/CD for public repos
- **Grafana Cloud**: 10k metrics series free

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Dawid Grabek** - React Developer transitioning to DevOps

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

---

_This project demonstrates modern DevOps practices using entirely free-tier services, perfect for portfolio and learning purposes._
