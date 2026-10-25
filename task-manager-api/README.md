# Task Manager API

A RESTful Node.js and Express API for managing tasks, featuring **asynchronous background processing with native EventEmitter (Practical 10)**.

## Setup & Running

```bash
npm install
npm start
```

To run the automated Practical 10 Event-Driven verification test:
```bash
npm run test:events
```

The server runs at `http://localhost:5000` by default.

---

## Practical 10: Event-Driven Asynchronous Processing

The API decouples long-running side-effects (such as email/push notifications and audit logging) from the critical HTTP request-response cycle using Node.js built-in `EventEmitter`.

### Event Architecture
- **`events.js`**: Central `EventEmitter` singleton.
- **`listeners.js`**: Background listeners registered at startup:
  - `task-created`: Dispatches notifications in background with simulated 2-second delay. Logs task title, assigned user, and completion timestamp.
  - `task-deleted`: Handles background cleanup and audit logging with 1-second delay.
  - `error`: Centralized listener catching any asynchronous listener errors to prevent Node process termination.
- **Immediate HTTP Response**: In `POST /tasks` and `DELETE /tasks/:id`, the response (`201` / `200`) is returned to the client immediately before the event listener finishes executing.

---

## Endpoints

| Method | Endpoint | Purpose | Event Emitted |
| --- | --- | --- | --- |
| GET | `/tasks` | Get all tasks | None |
| GET | `/tasks/:id` | Get one task by ID | None |
| POST | `/tasks` | Create a task | `task-created` |
| PUT | `/tasks/:id` | Update a task | None |
| DELETE | `/tasks/:id` | Delete a task | `task-deleted` |

POST and PUT requests must include the header `Content-Type: application/json`.

### Example Task Creation Request
```json
{
  "title": "Complete Practical 10",
  "description": "Event-driven asynchronous processing",
  "assignedTo": "Princy Patel"
}
```

### Response (Returned in ~10ms)
```json
{
  "message": "Task created",
  "task": {
    "id": 1792939633863,
    "title": "Complete Practical 10",
    "description": "Event-driven asynchronous processing",
    "assignedTo": "Princy Patel",
    "completed": false,
    "createdAt": "2026-10-25T14:47:13.863Z"
  }
}
```

### Background Worker Output (Executed 2 seconds later)
```
[Notification] Background notification sent: Task "Complete Practical 10" | Assigned to: Princy Patel | Completed at 2026-10-25T14:47:15.879Z
```
