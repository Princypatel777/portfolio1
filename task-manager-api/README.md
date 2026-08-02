# Task Manager API

A RESTful Node.js and Express API for managing tasks. Data is stored in memory and resets when the server restarts.

## Setup

```bash
npm install
npm run dev
```

The server runs at `http://localhost:5000` by default.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/:id` | Get one task by ID |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

POST and PUT requests must include the header `Content-Type: application/json`.

### Example request body

```json
{
  "title": "Complete Practical 4"
}
```

### Example update body

```json
{
  "title": "Complete Practical 4",
  "completed": true
}
```
