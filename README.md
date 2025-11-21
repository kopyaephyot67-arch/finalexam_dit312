# DIT312 Final Mini Project: Shop Products with CI/CD

Full-stack products shop application with automated CI/CD pipeline.

## ✅ Requirements Met

### 1. Application ✅
- Backend API: Express.js + MySQL with `/products` endpoint
- Frontend: Next.js displaying real shop product data
- Database: MySQL with products table + 5 seed products

### 2. Docker ✅
- Backend Dockerfile (Node.js Alpine)
- Frontend Dockerfile (Multi-stage build)
- docker-compose.yml with 4 services:
  - MySQL database
  - phpMyAdmin
  - Backend API
  - Frontend app
- .env + .env.example (no passwords in Git)

### 3. Jenkins CI/CD ✅
- Jenkinsfile in repository
- Pipeline stages: Checkout → Validate → Prepare → Deploy → Health Check → Verify
- Auto-trigger with Poll SCM (every 2 minutes)
- Secure credential management

## 🏗️ Architecture