# Practical 11: Containerization with Docker and Docker Compose

**Course Outcomes / Program Outcomes:** CO5 / PO3, PO5  
**Objective:** To containerize the full-stack application using Docker and orchestrate services using Docker Compose.

---

## 1. Architecture Overview & Network Topology

### Multi-Container Topology Diagram

```
                              HOST MACHINE (Browser / Postman)
                                     │               │
                                     │ :5173         │ :5000
                                     ▼               ▼
 ┌───────────────────────────────────┬──────────────────────────────────────────────┐
 │ DOCKER BRIDGE NETWORK: app-network│                                              │
 │                                   ▼                                              │
 │                    ┌─────────────────────────────┐                               │
 │                    │   frontend (React / Vite)   │                               │
 │                    │   Container: task-manager-  │                               │
 │                    │              frontend       │                               │
 │                    │   Port: 5173                │                               │
 │                    └──────────────┬──────────────┘                               │
 │                                   │ Internal proxy                               │
 │                                   │ http://backend:5000                          │
 │                                   ▼                                              │
 │                    ┌─────────────────────────────┐                               │
 │                    │   backend (Node / Express)  │                               │
 │                    │   Container: task-manager-  │                               │
 │                    │              backend        │                               │
 │                    │   Port: 5000                │                               │
 │                    └──────────────┬──────────────┘                               │
 │                                   │ Mongoose Connection                          │
 │                                   │ mongodb://mongodb:27017/taskdb               │
 │                                   ▼                                              │
 │                    ┌─────────────────────────────┐      ┌──────────────────────┐ │
 │                    │      mongodb (MongoDB)      │      │ Named Volume:        │ │
 │                    │   Container: task-manager-  │◄────►│ mongo-data           │ │
 │                    │              mongodb        │      │ Mount: /data/db      │ │
 │                    │   Port: 27017               │      │ (Persistent Storage) │ │
 │                    └─────────────────────────────┘      └──────────────────────┘ │
 └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Implemented Docker Configurations

### 1. Backend Dockerfile (`task-manager-api/Dockerfile`)
Encapsulates the Express.js API and Node.js runtime:
```dockerfile
FROM node:18

WORKDIR /app

# Leverage Docker layer caching for package dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### 2. Frontend Dockerfile (`Dockerfile`)
Containerizes the React client application and serves production preview assets (utilizing Node 22 to support Vite 8 and Rolldown's modern `node:util.styleText` requirements):
```dockerfile
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview", "--", "--host"]
```

### 3. Docker Compose Orchestration (`docker-compose.yml`)
Orchestrates all 3 containers on a custom bridge network with volume persistence:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: task-manager-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

  backend:
    build:
      context: ./task-manager-api
      dockerfile: Dockerfile
    container_name: task-manager-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://mongodb:27017/taskdb
      - NODE_ENV=production
    depends_on:
      - mongodb
    networks:
      - app-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: task-manager-frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://backend:5000
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongo-data:
    driver: local
```

### 4. Build Context Exclusion (`.dockerignore`)
Added in both root and backend directories to exclude unnecessary bloat:
* `node_modules` (prevents copying host binaries into container)
* `.git` and `.gitignore`
* `.env` files (secures local secrets)
* `dist` and logs

---

## 3. Key Questions & Theoretical Analysis

### Q1: Why does the backend container need to reference the MongoDB container by its service name (e.g., `mongodb`) rather than `localhost`?
**Answer:**  
In Docker, every container runs in its own isolated Linux network namespace with its own dedicated loopback network interface (`lo`, `127.0.0.1`). When code inside the backend container attempts to connect to `localhost:27017`, it is querying its **own local container loopback**, where no database process is listening.  
When services are attached to a user-defined bridge network (e.g., `app-network`), Docker Compose activates an embedded internal DNS server (`127.0.0.11`). Docker automatically registers each container's service name as an internal hostname. Resolving `mongodb` routes traffic directly to the internal IP address dynamically assigned to the MongoDB container across the virtual network bridge.

---

### Q2: What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
**Answer:**  
* **`EXPOSE` (Dockerfile):**
  * Serves as metadata and internal documentation between the image author and user.
  * It informs Docker that the container listens on specified network ports at runtime.
  * It **does NOT** open or publish any port to the host machine. Without explicit port publication, the port is unreachable from the host OS or outside Docker.
* **`ports` (`HOST:CONTAINER` in `docker-compose.yml`):**
  * Actively establishes a network translation rule (using `iptables` / Docker proxy) forwarding incoming connections from the host machine's port to the container's internal port.
  * For example, `"5173:5173"` routes requests sent to `http://localhost:5173` on the physical machine directly into port `5173` inside the frontend container.

---

### Q3: Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
**Answer:**  
1. **OS and Architecture Binary Incompatibility:**  
   Node packages often include compiled C/C++ native bindings (e.g., `bcrypt`, `sharp`, `sqlite3`, `fsevents`). If `npm install` was executed on Windows (`win32-x64`) or macOS (`darwin-arm64`), copying those binaries into a Linux container (`linux-x64` / Debian / Alpine) causes immediate runtime crash errors (`invalid ELF header` or `module not found`).
2. **Build Context Bloat & Transfer Latency:**  
   The `node_modules` directory typically contains tens of thousands of files totaling several hundred megabytes. Sending this entire tree over the Docker daemon socket drastically increases image build context preparation time.
3. **Reproducibility & Clean State:**  
   Running `npm install` (or `npm ci`) inside the container against `package-lock.json` guarantees that all dependencies are compiled cleanly for the target container Linux kernel and exact Node runtime environment.

---

## 4. Supplementary Solutions Implemented

1. **`.dockerignore` Optimization:**
   Created `.dockerignore` files in both `./` and `./task-manager-api` to keep build context minimal and prevent secret leakage.
2. **Multi-Stage Build Preparation:**
   Frontend image uses `AS build` step to isolate build dependencies from the runtime preview environment.
3. **MongoDB Persistent Named Volume:**
   Configured `mongo-data:/data/db` under `volumes:` in `docker-compose.yml`. Even if containers are stopped and destroyed (`docker-compose down`), all created tasks remain safely stored inside Docker's named storage volume.

---

## 5. Verification & Execution Commands

### Step 1: Start All Services
```bash
docker-compose up --build
```

### Step 2: Confirm Container Status
```bash
docker ps
```
*Expected Output:*
* `task-manager-mongodb` (Up, port `0.0.0.0:27017->27017/tcp`)
* `task-manager-backend` (Up, port `0.0.0.0:5000->5000/tcp`)
* `task-manager-frontend` (Up, port `0.0.0.0:5173->5173/tcp`)

### Step 3: Verify Endpoints
* **Frontend Web UI:** Open `http://localhost:5173` in any browser.
* **Backend API Check:** `curl http://localhost:5000/tasks` -> `{"tasks":[]}`
* **Create Task Test:**
  ```bash
  curl -X POST http://localhost:5000/tasks \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"Containerized Task\", \"assignedTo\": \"Princy Patel\"}"
  ```

