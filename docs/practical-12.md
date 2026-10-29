# Practical 12: CI/CD Pipeline with GitHub Actions

**Course Outcomes / Program Outcomes:** CO5 / PO3, PO5  
**Objective:** To automate testing and deployment of the application using a CI/CD pipeline.

---

## 1. Architecture Overview & Pipeline Topology

### Pipeline Execution Flow

```
                      DEVELOPER MACHINE
                             │
                             │ git push origin main / PR
                             ▼
 ┌───────────────────────────────────────────────────────────────────┐
 │ GITHUB ACTIONS CI RUNNER (ubuntu-latest virtual machine)          │
 │                                                                   │
 │  ┌─────────────────────────────────────────────────────────────┐  │
 │  │ Job 1: lint (Code Quality & Static Analysis)                │  │
 │  │ ├── actions/checkout@v4                                     │  │
 │  │ ├── actions/setup-node@v4 (Node 22)                         │  │
 │  │ ├── npm ci / npm install                                    │  │
 │  │ └── npm run lint (Oxlint) ────────────────────► Pass/Fail   │  │
 │  └──────────────────────────────┬──────────────────────────────┘  │
 │                                 │ (needs: lint must succeed)      │
 │                                 ▼                                 │
 │  ┌─────────────────────────────────────────────────────────────┐  │
 │  │ Job 2: build-and-test (Build Verification & API Tests)      │  │
 │  │ ├── actions/checkout@v4                                     │  │
 │  │ ├── actions/setup-node@v4 (Node 22)                         │  │
 │  │ ├── Step A: Frontend Production Build                       │  │
 │  │ │   ├── npm install                                         │  │
 │  │ │   └── npm run build (Vite 8 production bundle)            │  │
 │  │ └── Step B: Backend Automated API Test Suite                │  │
 │  │     ├── cd task-manager-api && npm install                  │  │
 │  │     └── npm test (Jest + Supertest)                         │  │
 │  └──────────────────────────────┬──────────────────────────────┘  │
 └─────────────────────────────────┼─────────────────────────────────┘
                                   │
                                   ▼
             GitHub Status: ✅ Green Checkmark or ❌ Red X
```

---

## 2. Implemented Configurations & Files

### 1. GitHub Actions Workflow (`.github/workflows/ci.yml`)
Configured to trigger on both direct pushes and pull requests targeting the `main` branch:
```yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Code Linting
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install Frontend Dependencies
        run: npm ci || npm install

      - name: Run Linter (Oxlint)
        run: npm run lint

  build-and-test:
    name: Build & Automated Tests
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install Frontend Dependencies
        run: npm ci || npm install

      - name: Build Frontend Application
        run: npm run build

      - name: Install Backend Dependencies
        working-directory: ./task-manager-api
        run: npm ci || npm install

      - name: Run Automated API Tests (Jest & Supertest)
        working-directory: ./task-manager-api
        run: npm test
```

### 2. Automated Test Suite (`task-manager-api/server.test.js`)
Comprehensive integration tests executed by Jest using Supertest without starting a physical TCP port:
```javascript
const request = require('supertest');
const { app } = require('./server');

describe('Task Management API Endpoints', () => {
  let createdTaskId = null;

  test('GET /tasks returns 200 and an array of tasks', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('tasks');
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test('POST /tasks creates a new task and returns 201', async () => {
    const newTask = {
      title: 'Automated CI Test Task',
      description: 'Verifying automated testing in GitHub Actions CI/CD pipeline',
      assignedTo: 'Princy Patel',
    };

    const res = await request(app)
      .post('/tasks')
      .send(newTask)
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('task');
    expect(res.body.task.title).toBe(newTask.title);

    createdTaskId = res.body.task.id || res.body.task._id;
  });

  test('POST /tasks returns 400 when title is missing or empty', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ description: 'Missing title task' })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /tasks/:id returns 200 for a valid task ID', async () => {
    const res = await request(app).get(`/tasks/${createdTaskId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('task');
  });

  test('DELETE /tasks/:id deletes the task and returns 200', async () => {
    const res = await request(app).delete(`/tasks/${createdTaskId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Task deleted');
  });
});
```

---

## 3. Key Questions & Theoretical Analysis

### Q1: What is the difference between Continuous Integration and Continuous Deployment, and which one does this practical actually demonstrate?
**Answer:**  
* **Continuous Integration (CI):**  
  The engineering practice where developers frequently commit code to a shared repository. Every push triggers an automated build and test runner that detects syntax errors, type flaws, linting violations, and broken logic before changes merge into production branches.
* **Continuous Deployment (CD):**  
  An extension of CI where every build that successfully clears the automated verification pipeline is automatically released, packaged (e.g., containerized), and deployed directly to live production cloud infrastructure without manual approval or human intervention.
* **What this practical demonstrates:**  
  This practical demonstrates **Continuous Integration (CI)**. It automatically validates code quality (Oxlint), builds the frontend bundle (Vite), and executes the backend integration tests (Jest + Supertest) on an ephemeral `ubuntu-latest` runner, producing a pass/fail verification status without executing deployment steps to a remote server.

---

### Q2: Why does running tests automatically on every push catch problems earlier than testing manually before a release?
**Answer:**  
1. **Immediate Feedback & Reduced Blast Radius:**  
   Because tests run on individual commits or pull requests, failures are immediately traced back to the exact few lines of code changed in that specific commit, reducing debugging time from hours to seconds.
2. **Determinism and Consistency:**  
   Manual pre-release testing is prone to human error, missed test cases, and "works on my machine" inconsistencies. CI tests run in a standardized, clean virtual machine (`ubuntu-latest`) against the repository's exact declared dependencies.
3. **Exponential Cost Reduction:**  
   Catching defects during active development (minutes after authoring) is orders of magnitude cheaper and less disruptive than identifying regressions during staging or after customer-facing release.

---

### Q3: What would happen to the pipeline if the test file path were incorrect — would the workflow fail at the same step as a genuine test failure?
**Answer:**  
* **Workflow Step Location:**  
  Yes, the pipeline would still fail at the exact same step: `Run Automated API Tests (Jest & Supertest)`.
* **Diagnostic Distinction:**  
  Although the step is the same, the failure signature in the GitHub Actions runner log is completely different:
  * **File Path / Missing Pattern Error:** Jest prints `No tests found related to files matching <path>` and exits with status code 1. Zero test suites or assertions are recorded.
  * **Genuine Test Failure:** Jest executes the tests, prints detailed assertion difference traces (e.g., `Expected: 200, Received: 500`), highlights the exact failing line of code, and displays the test suite summary (e.g., `Tests: 1 failed, 4 passed`).

---

## 4. Supplementary Solutions Implemented

1. **Multi-Job Dependency Graph (`lint` before `build-and-test`):**  
   Configured `needs: lint` in `.github/workflows/ci.yml`. If code fails linting checks, test execution is halted immediately, saving runner minutes.
2. **Pull Request Triggering:**  
   Configured `pull_request: branches: [main]` so contributor PRs are tested prior to merge.
3. **Dynamic README Status Badge:**  
   Added GitHub Actions status badge in `README.md`:
   ```markdown
   [![CI Pipeline](https://github.com/Princypatel777/portfolio1/actions/workflows/ci.yml/badge.svg)](https://github.com/Princypatel777/portfolio1/actions/workflows/ci.yml)
   ```

---

## 5. Lab Demonstration: Failed vs. Fixed Pipeline

### Demonstration A: Inducing a Broken Test (Red ❌)
To demonstrate pipeline failure in your lab journal:
1. Open `task-manager-api/server.test.js`.
2. Change line 8 from:
   ```javascript
   expect(res.statusCode).toBe(200);
   ```
   to:
   ```javascript
   expect(res.statusCode).toBe(404); // Deliberate failure
   ```
3. Commit and push:
   ```bash
   git commit -am "test: deliberate failure to demonstrate CI pipeline rejection"
   git push origin main
   ```
4. Navigate to the **Actions** tab on your GitHub repository. The run will fail with a red ❌ and the email notification will record the test assertion failure.

### Demonstration B: Fixing the Test (Green ✅)
1. Revert line 8 back to `expect(res.statusCode).toBe(200);`.
2. Commit and push:
   ```bash
   git commit -am "test: restore valid assertion to pass CI pipeline"
   git push origin main
   ```
3. The GitHub Actions runner will rebuild, all tests will pass, and the workflow will display a green checkmark ✅.
