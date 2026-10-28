const express = require('express')
const mongoose = require('mongoose')
const taskEvents = require('./events')
const Task = require('./models/Task')
require('./listeners')

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/taskdb'

// In-memory fallback for standalone testing when MongoDB is not connected
const tasks = []
let isMongoConnected = false

// ==================== MongoDB Connection ====================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    isMongoConnected = true
    console.log(`[Database] Connected to MongoDB at ${MONGO_URI}`)
  })
  .catch((err) => {
    isMongoConnected = false
    console.warn(`[Database] MongoDB connection warning (${MONGO_URI}): ${err.message}. Using in-memory fallback.`)
  })

mongoose.connection.on('connected', () => {
  isMongoConnected = true
})
mongoose.connection.on('disconnected', () => {
  isMongoConnected = false
})

// ==================== Middleware ====================
// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`)
  next()
})

// CORS headers to enable direct browser access from frontend container (port 5173)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// JSON parser
app.use(express.json())

// Content-Type validation
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || ''
  const requiresJson = req.method === 'POST' || req.method === 'PUT'

  if (requiresJson && !contentType.toLowerCase().startsWith('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' })
  }

  next()
})

// Task ID validation middleware
async function validateTaskId(req, res, next) {
  const { id } = req.params

  const isValidMongoId = mongoose.Types.ObjectId.isValid(id)
  const isNumericId = /^\d+$/.test(id)

  if (!isValidMongoId && !isNumericId) {
    return res.status(400).json({ error: 'Task ID must be a valid ID' })
  }

  if (isMongoConnected) {
    try {
      if (isValidMongoId) {
        const doc = await Task.findById(id)
        if (doc) {
          req.task = doc
          return next()
        }
      }
    } catch (err) {
      console.error('[Database] Error retrieving task by id:', err.message)
    }
  }

  // Fallback to in-memory list
  const memTask = tasks.find((item) => String(item.id) === String(id) || String(item._id) === String(id))
  if (memTask) {
    req.task = memTask
    return next()
  }

  return res.status(404).json({ error: 'Task not found' })
}

// ==================== Routes ====================

// GET /tasks - Retrieve all tasks
app.get('/tasks', async (req, res) => {
  if (isMongoConnected) {
    try {
      const dbTasks = await Task.find().sort({ createdAt: -1 })
      return res.status(200).json({ tasks: dbTasks })
    } catch (err) {
      console.error('[Database] Query error:', err.message)
    }
  }
  res.status(200).json({ tasks })
})

// GET /tasks/:id - Retrieve a single task
app.get('/tasks/:id', validateTaskId, (req, res) => {
  res.status(200).json({ task: req.task })
})

// POST /tasks - Create a new task (Immediate response + async event emit)
app.post('/tasks', async (req, res) => {
  const { title, description, assignedTo, assignedUser, simulateError } = req.body

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' })
  }

  const assigned = typeof assignedTo === 'string' ? assignedTo.trim() : (typeof assignedUser === 'string' ? assignedUser.trim() : 'Unassigned')
  const taskDesc = typeof description === 'string' ? description.trim() : ''

  let task = null

  if (isMongoConnected) {
    try {
      const doc = new Task({
        title: title.trim(),
        description: taskDesc,
        assignedTo: assigned,
        completed: false,
        simulateError: Boolean(simulateError),
      })
      await doc.save()
      task = doc.toJSON()
    } catch (err) {
      console.error('[Database] Save error:', err.message)
    }
  }

  if (!task) {
    const id = Date.now()
    task = {
      id,
      _id: String(id),
      title: title.trim(),
      description: taskDesc,
      assignedTo: assigned,
      completed: false,
      createdAt: new Date().toISOString(),
      ...(simulateError ? { simulateError: true } : {}),
    }
    tasks.push(task)
  }

  // 1. API Responds immediately
  console.log(`[API] Response sent at ${new Date().toISOString()}`)
  res.status(201).json({ message: 'Task created', task })

  // 2. Emit task-created event asynchronously handled by background listener
  taskEvents.emit('task-created', task)
})

// PUT /tasks/:id - Update task details
app.put('/tasks/:id', validateTaskId, async (req, res) => {
  const { title, completed } = req.body

  if (title === undefined && completed === undefined) {
    return res.status(400).json({ error: 'Provide title and/or completed to update a task' })
  }

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'Title must be a non-empty string' })
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Completed must be a boolean' })
  }

  if (isMongoConnected && req.task instanceof mongoose.Document) {
    if (title !== undefined) req.task.title = title.trim()
    if (completed !== undefined) req.task.completed = completed
    await req.task.save()
    return res.status(200).json({ message: 'Task updated', task: req.task.toJSON() })
  }

  if (title !== undefined) req.task.title = title.trim()
  if (completed !== undefined) req.task.completed = completed

  res.status(200).json({ message: 'Task updated', task: req.task })
})

// DELETE /tasks/:id - Remove task (Immediate response + async event emit)
app.delete('/tasks/:id', validateTaskId, async (req, res) => {
  let deletedTask = req.task

  if (isMongoConnected && req.task instanceof mongoose.Document) {
    await Task.findByIdAndDelete(req.task._id)
    deletedTask = req.task.toJSON()
  } else {
    const index = tasks.findIndex((item) => String(item.id) === String(req.task.id) || String(item._id) === String(req.task._id))
    if (index !== -1) {
      const [removed] = tasks.splice(index, 1)
      deletedTask = removed
    }
  }

  console.log(`[API] Delete response sent at ${new Date().toISOString()}`)
  res.status(200).json({ message: 'Task deleted', task: deletedTask })

  // Emit task-deleted event asynchronously handled by background listener
  taskEvents.emit('task-deleted', deletedTask)
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong' })
})

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Task API is running at http://localhost:${PORT}`)
  })
}

module.exports = { app, tasks }
