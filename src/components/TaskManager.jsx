import { useState, useEffect } from 'react'
import './TaskManager.css'
import Spinner from './Spinner'
import ErrorMessage from './ErrorMessage'

const API_URL = 'http://localhost:5000/tasks'

function TaskManager() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [filter, setFilter] = useState('all') // all, active, completed

  // Fetch all tasks
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      setTasks(data.tasks)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create new task
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          completed: false
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.errors?.[0] || 'Failed to create task')
      }

      const data = await response.json()
      setTasks([data.task, ...tasks])
      setTitle('')
      setDescription('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Update task
  const handleUpdateTask = async (taskId, updates) => {
    setError(null)
    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update task')

      const data = await response.json()
      setTasks(tasks.map(t => t._id === taskId ? data.task : t))
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    setError(null)
    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete task')

      setTasks(tasks.filter(t => t._id !== taskId))
    } catch (err) {
      setError(err.message)
    }
  }

  // Filter tasks
  const getFilteredTasks = () => {
    switch (filter) {
      case 'active':
        return tasks.filter(t => !t.completed)
      case 'completed':
        return tasks.filter(t => t.completed)
      default:
        return tasks
    }
  }

  const filteredTasks = getFilteredTasks()
  const completedCount = tasks.filter(t => t.completed).length
  const activeCount = tasks.length - completedCount

  return (
    <div className="task-manager-container">
      <div className="task-manager">
        <h1>📝 Task Manager</h1>
        <p className="subtitle">Stay organized with your personal to-do list</p>

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Stats */}
        <div className="task-stats">
          <div className="stat">
            <span className="stat-label">Total</span>
            <span className="stat-value">{tasks.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Active</span>
            <span className="stat-value active">{activeCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Completed</span>
            <span className="stat-value completed">{completedCount}</span>
          </div>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="add-task-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Task title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : '➕ Add Task'}
          </button>
        </form>

        {/* Filter Buttons */}
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({tasks.length})
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Loading State */}
        {loading && <Spinner />}

        {/* Tasks List */}
        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p>
                {tasks.length === 0
                  ? '✨ No tasks yet. Create one to get started!'
                  : `📭 No ${filter === 'active' ? 'active' : filter === 'completed' ? 'completed' : ''} tasks`}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <div className="task-content">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() =>
                      handleUpdateTask(task._id, { completed: !task.completed })
                    }
                    className="task-checkbox"
                  />
                  <div className="task-text">
                    <h3 className="task-title">{task.title}</h3>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    <p className="task-date">
                      Created: {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="btn btn-delete"
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {/* Refresh Button */}
        {!loading && (
          <button onClick={fetchTasks} className="btn btn-secondary">
            🔄 Refresh
          </button>
        )}
      </div>
    </div>
  )
}

export default TaskManager
