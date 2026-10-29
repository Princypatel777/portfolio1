// Keep the backend address in one place so components only deal with tasks.
export const BASE_URL = ''
const TOKEN_KEY = 'task_api_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...options.headers }

  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.errors?.[0] || data.error || data.message || 'Something went wrong')
  }

  return data
}

export function register(credentials) {
  return request('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export async function login(credentials) {
  const data = await request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  saveToken(data.token)
  return data
}

export async function getTasks() {
  return (await request('/tasks')).tasks
}

export async function createTask(task) {
  return (await request('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })).task
}

export async function updateTask(id, task) {
  return (await request(`/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })).task
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' })
}

export async function generateTaskDescription(title) {
  return request('/api/ai/generate-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
}
