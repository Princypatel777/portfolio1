const express = require('express')
const taskEvents = require('./events')
require('./listeners')

const app = express()
const PORT = process.env.PORT || 5000
const tasks = []

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`)
  next()
})

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.use(express.json())

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || ''
  const requiresJson = req.method === 'POST' || req.method === 'PUT'

  if (requiresJson && !contentType.toLowerCase().startsWith('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' })
  }

  next()
})

function validateTaskId(req, res, next) {
  const paramId = String(req.params.id)
  const task = tasks.find((item) => String(item.id) === paramId || String(item._id) === paramId)

  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }

  req.task = task
  next()
}

app.get('/tasks', (req, res) => {
  res.status(200).json({ tasks })
})

app.get('/tasks/:id', validateTaskId, (req, res) => {
  res.status(200).json({ task: req.task })
})

app.post('/tasks', (req, res) => {
  const { title, description, assignedTo, assignedUser, simulateError } = req.body

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' })
  }

  const id = Date.now()
  const task = {
    id,
    _id: String(id),
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    assignedTo: typeof assignedTo === 'string' ? assignedTo.trim() : (typeof assignedUser === 'string' ? assignedUser.trim() : 'Unassigned'),
    completed: false,
    createdAt: new Date().toISOString(),
    ...(simulateError ? { simulateError: true } : {})
  }

  tasks.push(task)

  // API responds immediately
  console.log(`[API] Response sent at ${new Date().toISOString()}`)
  res.status(201).json({ message: 'Task created', task })

  // Emit task-created event asynchronously handled by background listener
  taskEvents.emit('task-created', task)
})

app.put('/tasks/:id', validateTaskId, (req, res) => {
  const { title, completed } = req.body

  if (title === undefined && completed === undefined) {
    return res.status(400).json({ error: 'Provide title and/or completed to update a task' })
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title must be a non-empty string' })
    }
    req.task.title = title.trim()
  }

  if (completed !== undefined) {
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Completed must be a boolean' })
    }
    req.task.completed = completed
  }

  res.status(200).json({ message: 'Task updated', task: req.task })
})

app.delete('/tasks/:id', validateTaskId, (req, res) => {
  const taskIndex = tasks.findIndex((item) => item.id === req.task.id)
  const [deletedTask] = tasks.splice(taskIndex, 1)

  console.log(`[API] Delete response sent at ${new Date().toISOString()}`)
  res.status(200).json({ message: 'Task deleted', task: deletedTask })

  // Emit task-deleted event asynchronously handled by background listener
  taskEvents.emit('task-deleted', deletedTask)
})

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

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
