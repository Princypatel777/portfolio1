# Task Manager API - Implementation Checklist

## Project Overview
Extend the Task Management backend with MongoDB using Mongoose, replacing in-memory array with real database operations.

---

## ✅ COMPLETED TASKS

### 1. ✅ MongoDB Connection Setup
- [x] Install Mongoose package
- [x] Configure MongoDB connection in server.js
- [x] Add .env file for MONGO_URI configuration
- [x] Connection error handling

### 2. ✅ Task Schema Definition
- [x] Define Task schema with 4+ required fields:
  - [x] `title` - String, required
  - [x] `description` - String, optional
  - [x] `completed` - Boolean, default false
  - [x] `createdAt` - Date, default Date.now
- [x] Mongoose model created (models/Task.js)
- [x] Validation messages for required fields

### 3. ✅ Express Server Setup
- [x] Express.js configured
- [x] JSON middleware setup
- [x] Request logging middleware
- [x] Content-Type validation middleware

### 4. ✅ CRUD Operations Implementation
- [x] GET /tasks - Retrieve all tasks (sorted by createdAt descending)
- [x] GET /tasks/:id - Retrieve single task by ID
- [x] POST /tasks - Create new task with validation
- [x] PUT /tasks/:id - Update task with validation
- [x] DELETE /tasks/:id - Delete task by ID

### 5. ✅ Error Handling
- [x] Validation error formatting (structured JSON)
- [x] 404 Route handler
- [x] Global error handler middleware
- [x] Mongoose ValidationError catching and formatting

---

## 📋 TESTING CHECKLIST

Use Postman or similar tool to verify all operations:

### GET Operations
- [ ] GET http://localhost:5000/tasks
  - Expected: 200, returns array of all tasks sorted by date
  
- [ ] GET http://localhost:5000/tasks/{valid_id}
  - Expected: 200, returns single task object
  
- [ ] GET http://localhost:5000/tasks/{invalid_id}
  - Expected: 404, error message "Task not found"

### POST Operations (Create)
- [ ] POST http://localhost:5000/tasks
  - Body: `{ "title": "My Task", "description": "Task details", "completed": false }`
  - Expected: 201, returns created task with _id
  
- [ ] POST http://localhost:5000/tasks (missing title)
  - Body: `{ "description": "No title provided" }`
  - Expected: 400, validation error message

### PUT Operations (Update)
- [ ] PUT http://localhost:5000/tasks/{valid_id}
  - Body: `{ "completed": true }` or `{ "title": "Updated Title" }`
  - Expected: 200, returns updated task
  
- [ ] PUT http://localhost:5000/tasks/{invalid_id}
  - Expected: 404, error message "Task not found"
  
- [ ] PUT http://localhost:5000/tasks/{valid_id} (invalid data)
  - Body: `{ "title": "" }` (empty required field)
  - Expected: 400, validation error

### DELETE Operations
- [ ] DELETE http://localhost:5000/tasks/{valid_id}
  - Expected: 200, returns deleted task
  
- [ ] DELETE http://localhost:5000/tasks/{invalid_id}
  - Expected: 404, error message "Task not found"

### Content-Type Validation
- [ ] POST/PUT without Content-Type: application/json header
  - Expected: 400, error message "Content-Type must be application/json"

---

## 🔧 REQUIRED FILES

### .env (Create if not exists)
```
MONGO_URI=mongodb://localhost:27017/taskmanager
NODE_ENV=development
```

### Key Files Present
- ✅ [models/Task.js](models/Task.js) - Mongoose schema
- ✅ [server.js](server.js) - Express server with routes
- ✅ [package.json](package.json) - Dependencies

---

## 🚀 QUICK START COMMANDS

```bash
# Install dependencies
npm install

# Start MongoDB (if running locally)
mongod

# Start the server
npm start
# Server runs at http://localhost:5000
```

---

## 📝 POSTMAN TEST TEMPLATE

### Collection Setup
1. Create new collection: "Task Manager API"
2. Add Authorization (if needed): None for now
3. Create requests following the testing checklist above

### Sample Requests

**GET All Tasks**
```
GET http://localhost:5000/tasks
```

**Create Task**
```
POST http://localhost:5000/tasks
Content-Type: application/json

{
  "title": "Complete Project",
  "description": "Finish MongoDB integration",
  "completed": false
}
```

**Update Task**
```
PUT http://localhost:5000/tasks/{id}
Content-Type: application/json

{
  "completed": true
}
```

**Delete Task**
```
DELETE http://localhost:5000/tasks/{id}
```

---

## 📊 VALIDATION & RESPONSE FORMAT

### Successful Create Response (201)
```json
{
  "message": "Task created",
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "My Task",
    "description": "Task details",
    "completed": false,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Validation Error Response (400)
```json
{
  "message": "Validation Error",
  "errors": [
    "Title is required"
  ]
}
```

### Not Found Response (404)
```json
{
  "error": "Task not found"
}
```

### Server Error Response (500)
```json
{
  "error": "Something went wrong"
}
```

---

## 🎯 NEXT STEPS (Optional Enhancements)

- [ ] Add priority field to Task schema
- [ ] Add filtering by status (completed/pending)
- [ ] Add pagination for tasks list
- [ ] Add search functionality for task title/description
- [ ] Add CORS middleware for frontend integration
- [ ] Add request validation (joi or yup)
- [ ] Add JWT authentication
- [ ] Add unit tests with Jest/Mocha
- [ ] Deploy to production (Heroku, Vercel, etc.)

---

## 📌 CURRENT STATUS: READY FOR TESTING ✅

All backend implementation is complete. Proceed with Postman testing using the checklist above.
