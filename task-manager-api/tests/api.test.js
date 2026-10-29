const request = require('supertest')
const { app } = require('../server')

describe('Task Manager REST API & Middleware Suite (CI/CD Automated Tests)', () => {
  test('GET /tasks returns status 200 and JSON array', async () => {
    const res = await request(app).get('/tasks')
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('tasks')
    expect(Array.isArray(res.body.tasks)).toBe(true)
  })

  test('GET /debug/cache returns 200 with cache statistics', async () => {
    const res = await request(app).get('/debug/cache')
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('stats')
  })

  test('GET /tasks/events/log returns 200 with EventEmitter status', async () => {
    const res = await request(app).get('/tasks/events/log')
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('status', 'active')
    expect(res.body).toHaveProperty('eventEmitter')
  })

  test('POST /tasks without application/json returns 400 or 415', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Content-Type', 'text/plain')
      .send('not a json string')
    expect([400, 415]).toContain(res.statusCode)
  })

  test('POST /tasks without title returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Content-Type', 'application/json')
      .send({ description: 'Task missing title' })
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('GET /undefined-route returns 404 Not Found', async () => {
    const res = await request(app).get('/undefined-route')
    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  test('GET /trigger-error triggers 500 Internal Server Error safely', async () => {
    const res = await request(app).get('/trigger-error')
    expect(res.statusCode).toBe(500)
    expect(res.body).toHaveProperty('error')
  })

  test('POST /api/ai/generate-description without title returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Content-Type', 'application/json')
      .send({})
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('POST /api/ai/generate-description generates description with disclaimer', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Content-Type', 'application/json')
      .send({ title: 'Implement JWT Authentication' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('description')
    expect(res.body).toHaveProperty('disclaimer')
    expect(res.body).toHaveProperty('suggestedPriority')
  })

  test('POST /api/ai/generate-description returns 429 on rapid identical requests', async () => {
    const testIp = '172.16.0.42'
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/ai/generate-description')
        .set('x-forwarded-for', testIp)
        .send({ title: 'Rapid Query Task' })
    }
    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('x-forwarded-for', testIp)
      .send({ title: 'Rapid Query Task' })
    expect(res.statusCode).toBe(429)
    expect(res.body).toHaveProperty('rateLimited', true)
  })
})
