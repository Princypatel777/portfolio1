const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
require('dotenv').config({ path: path.join(__dirname, '.env.example') })
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const express = require('express')
const mongoose = require('mongoose')
const OpenAI = require('openai')
const taskEvents = require('./events')
const Task = require('./models/Task')
require('./listeners')

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/taskdb'

// AI Rate Limiting Tracker (Supplementary Problem 2: Max 5 requests per minute per client)
const aiRateLimitMap = new Map()
const AI_RATE_LIMIT_WINDOW_MS = 60 * 1000
const AI_MAX_REQUESTS_PER_WINDOW = 5

// In-memory fallback for standalone testing when MongoDB is not connected
const tasks = []
let isMongoConnected = false

// ==================== MongoDB Connection ====================
if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_MONGO_IN_TEST === 'true') {
  mongoose
    .connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
    .then(() => {
      isMongoConnected = true
      console.log(`[Database] Connected to MongoDB at ${MONGO_URI}`)
    })
    .catch((err) => {
      isMongoConnected = false
      console.warn(`[Database] MongoDB connection warning (${MONGO_URI}): ${err.message}. Using in-memory fallback.`)
    })
}

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

// Helper to generate domain-aware fallback and metadata for Practical 13
function getFallbackDetails(taskTitle) {
  const lower = taskTitle.toLowerCase()
  let desc = `Coordinate and execute all planned action items, unit tests, and validation for "${taskTitle}".`
  let priority = 'medium'
  let category = 'General'

  if (lower.includes('jwt') || lower.includes('auth') || lower.includes('security') || lower.includes('login')) {
    desc = `Implement secure authentication workflows, credential hashing, session tokens, and route protection for "${taskTitle}".`
    priority = 'high'
    category = 'Learning'
  } else if (lower.includes('database') || lower.includes('mongo') || lower.includes('sql') || lower.includes('backend')) {
    desc = `Design schema architectures, database connections, query optimizations, and endpoint controllers for "${taskTitle}".`
    priority = 'high'
    category = 'Backend'
  } else if (lower.includes('docker') || lower.includes('ci') || lower.includes('cd') || lower.includes('pipeline') || lower.includes('deploy')) {
    desc = `Configure container environments, orchestration scripts, and automated build pipelines for "${taskTitle}".`
    priority = 'medium'
    category = 'DevOps'
  } else if (lower.includes('ui') || lower.includes('frontend') || lower.includes('react') || lower.includes('css')) {
    desc = `Develop responsive component layouts, user state handling, and interactive accessibility for "${taskTitle}".`
    priority = 'medium'
    category = 'Frontend'
  } else if (lower.includes('test') || lower.includes('jest') || lower.includes('bug') || lower.includes('fix')) {
    desc = `Write comprehensive test suites, reproduce reported defects, and verify test assertions for "${taskTitle}".`
    priority = 'high'
    category = 'Quality Assurance'
  }

  return { desc, priority, category }
}

// POST /api/ai/generate-description - AI Description Generator with Graceful Degradation
app.post('/api/ai/generate-description', async (req, res) => {
  const { title } = req.body

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required to generate a description' })
  }

  const cleanTitle = title.trim()
  const fallbackInfo = getFallbackDetails(cleanTitle)
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'client-default'
  const now = Date.now()

  // 1. Rate Limiting Check (Supplementary Problem 2)
  const timestamps = (aiRateLimitMap.get(clientIp) || []).filter((ts) => now - ts < AI_RATE_LIMIT_WINDOW_MS)
  if (timestamps.length >= AI_MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a minute before requesting another AI description.',
      rateLimited: true,
    })
  }
  timestamps.push(now)
  aiRateLimitMap.set(clientIp, timestamps)

  // 2. Test Environment Predictable Handling (prevents network timeouts in CI)
  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_LIVE_AI_TESTS !== 'true') {
    return res.status(200).json({
      description: fallbackInfo.desc,
      suggestedPriority: fallbackInfo.priority,
      suggestedCategory: fallbackInfo.category,
      source: 'test-mock',
      fallback: false,
      disclaimer: 'This suggestion was generated locally (Responsible AI graceful degradation). Review before saving.',
    })
  }

  let lastErrorDetail = ''

  // 3. Try OpenAI API if Key is Configured
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_key_here') {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful task assistant. Provide a concise, professional 1-2 sentence description for a task based on its title.',
          },
          {
            role: 'user',
            content: `Write a short task description for: ${cleanTitle}`,
          },
        ],
        max_tokens: 120,
        temperature: 0.7,
      })

      const generated = completion.choices[0]?.message?.content?.trim()
      if (generated) {
        return res.status(200).json({
          description: generated,
          suggestedPriority: fallbackInfo.priority,
          suggestedCategory: fallbackInfo.category,
          source: 'openai',
          fallback: false,
          disclaimer: 'AI-generated suggestion via OpenAI. Review before saving.',
        })
      }
    } catch (err) {
      lastErrorDetail = `OpenAI: ${err.message}`
      console.warn(`[AI Service] OpenAI API error: ${err.message}. Engaging graceful fallback.`)
    }
  }

  // 4. Try Google Gemini API if Key is Configured
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_key_here') {
    const geminiModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro']
    for (const model of geminiModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a helpful task assistant. Provide a concise, professional 1-2 sentence task description for: ${cleanTitle}`,
                  },
                ],
              },
            ],
          }),
        })

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json()
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (text) {
            return res.status(200).json({
              description: text,
              suggestedPriority: fallbackInfo.priority,
              suggestedCategory: fallbackInfo.category,
              source: `gemini (${model})`,
              fallback: false,
              disclaimer: 'AI-generated suggestion via Google Gemini. Review before saving.',
            })
          }
        } else {
          const errData = await geminiResponse.json().catch(() => ({}))
          if (errData.error?.message) {
            lastErrorDetail = `Gemini: ${errData.error.message}`
          }
        }
      } catch (err) {
        lastErrorDetail = `Gemini: ${err.message}`
        console.warn(`[AI Service] Gemini API error: ${err.message}. Engaging graceful fallback.`)
      }
    }
  }

  // 5. Graceful Degradation Fallback (Core Requirement)
  return res.status(200).json({
    description: fallbackInfo.desc,
    suggestedPriority: fallbackInfo.priority,
    suggestedCategory: fallbackInfo.category,
    source: 'graceful-fallback',
    fallback: true,
    disclaimer: 'This suggestion was generated locally (Responsible AI graceful degradation). Review before saving.',
  })
})

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
