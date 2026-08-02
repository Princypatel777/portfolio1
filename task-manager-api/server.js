const express = require('express')

const app = express()
const PORT = process.env.PORT || 5000
const tasks = []

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`)
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
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Task ID must be a number' })
  }

  const task = tasks.find((item) => item.id === Number(req.params.id))

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
  const { title } = req.body

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' })
  }

  const task = {
    id: Date.now(),
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  }

  tasks.push(task)
  res.status(201).json({ message: 'Task created', task })
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

  res.status(200).json({ message: 'Task deleted', task: deletedTask })
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
