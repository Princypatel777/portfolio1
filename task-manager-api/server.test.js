const request = require('supertest')
const { app } = require('./server')

describe('Task Management API Endpoints', () => {
  let createdTaskId = null

  test('GET /tasks returns 200 and an array of tasks', async () => {
    const res = await request(app).get('/tasks')
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('tasks')
    expect(Array.isArray(res.body.tasks)).toBe(true)
  })

  test('POST /tasks creates a new task and returns 201', async () => {
    const newTask = {
      title: 'Automated CI Test Task',
      description: 'Verifying automated testing in GitHub Actions CI/CD pipeline',
      assignedTo: 'Princy Patel',
    }

    const res = await request(app)
      .post('/tasks')
      .send(newTask)
      .set('Content-Type', 'application/json')

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('task')
    expect(res.body.task.title).toBe(newTask.title)
    expect(res.body.task.assignedTo).toBe('Princy Patel')

    createdTaskId = res.body.task.id || res.body.task._id
  })

  test('POST /tasks returns 400 when title is missing or empty', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ description: 'Missing title task' })
      .set('Content-Type', 'application/json')

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('GET /tasks/:id returns 200 for a valid task ID', async () => {
    expect(createdTaskId).not.toBeNull()
    const res = await request(app).get(`/tasks/${createdTaskId}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('task')
  })

  test('DELETE /tasks/:id deletes the task and returns 200', async () => {
    expect(createdTaskId).not.toBeNull()
    const res = await request(app).delete(`/tasks/${createdTaskId}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message', 'Task deleted')
  })

  describe('AI Description Generator (/api/ai/generate-description)', () => {
    test('POST /api/ai/generate-description generates a description successfully', async () => {
      const res = await request(app)
        .post('/api/ai/generate-description')
        .send({ title: 'Deploy Web Application' })
        .set('Content-Type', 'application/json')

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('description')
      expect(typeof res.body.description).toBe('string')
      expect(res.body.description.length).toBeGreaterThan(0)
    })

    test('POST /api/ai/generate-description returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/ai/generate-description')
        .send({})
        .set('Content-Type', 'application/json')

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    test('POST /api/ai/generate-description returns 429 when rate limit is exceeded', async () => {
      // Simulate exceeding rate limit for a unique IP
      const agent = request(app)
      const testIp = '192.168.1.100'

      for (let i = 0; i < 5; i++) {
        await agent
          .post('/api/ai/generate-description')
          .set('x-forwarded-for', testIp)
          .send({ title: 'Rate Limit Test Task' })
      }

      // 6th call from same IP in the same minute should be rejected
      const rateLimitedRes = await agent
        .post('/api/ai/generate-description')
        .set('x-forwarded-for', testIp)
        .send({ title: 'Rate Limit Test Task' })

      expect(rateLimitedRes.statusCode).toBe(429)
      expect(rateLimitedRes.body).toHaveProperty('rateLimited', true)
    })
  })
})
