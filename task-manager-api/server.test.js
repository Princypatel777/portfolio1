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
})
