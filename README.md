# Task Management Full-Stack Application

[![CI Pipeline](https://github.com/Princypatel777/portfolio1/actions/workflows/ci.yml/badge.svg)](https://github.com/Princypatel777/portfolio1/actions/workflows/ci.yml)

A full-stack Task Management application containerized with Docker and automated with continuous integration using GitHub Actions.

---

## 🛠️ Technology Stack
- **Frontend:** React 19, Vite 8, React Router DOM
- **Backend:** Node.js, Express.js, Native EventEmitter, Mongoose, MongoDB
- **Testing & Quality:** Jest, Supertest, Oxlint
- **DevOps & CI/CD:** Docker, Docker Compose, GitHub Actions

---

## 🚀 Quick Start (Local Docker Compose)
```bash
docker-compose up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:5000/tasks

---

## 🧪 Running Automated Tests
```bash
# Run backend tests
cd task-manager-api
npm test

# Run linter
npm run lint
```
