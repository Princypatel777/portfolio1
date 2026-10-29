import { useEffect, useState } from 'react'
import { createTask, deleteTask, generateTaskDescription, getTasks, updateTask } from '../api'
import './TaskPage.css'

export default function TaskPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiNotice, setAiNotice] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDescription, setEditingDescription] = useState('')

  const getId = (task) => task._id || task.id

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    setLoading(true)
    setError('')
    try {
      setTasks(await getTasks())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateDescription() {
    if (!title.trim()) {
      setError('Please enter a task title first before generating a description.')
      return
    }
    setError('')
    setAiNotice('')
    setAiLoading(true)

    try {
      const data = await generateTaskDescription(title.trim())
      if (data && data.description) {
        setDescription(data.description)
        if (data.fallback) {
          setAiNotice(data.message || 'ℹ️ Fallback description used (AI service unavailable or key not configured). Feel free to customize.')
        } else {
          setAiNotice('✨ AI-generated suggestion loaded! You can modify it before saving.')
        }
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('rate limit')) {
        setError('⏳ Rate limit exceeded: Please wait a minute before requesting another AI description.')
      } else {
        setDescription(`Complete planned action items and deliver requirements for "${title.trim()}".`)
        setAiNotice('ℹ️ Fallback template generated. Review and adjust as needed.')
      }
    } finally {
      setAiLoading(false)
    }
  }

  async function addTask(event) {
    event.preventDefault()
    if (!title.trim()) return setError('Title is required.')
    setError('')
    try {
      const task = await createTask({
        title: title.trim(),
        description: description.trim(),
        completed: false,
      })
      setTasks((current) => [task, ...current])
      setTitle('')
      setDescription('')
      setAiNotice('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function changeTask(id, changes) {
    setError('')
    try {
      const updated = await updateTask(id, changes)
      setTasks((current) => current.map((task) => (getId(task) === id ? updated : task)))
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  async function removeTask(id) {
    if (!window.confirm('Delete this task?')) return
    setError('')
    try {
      await deleteTask(id)
      setTasks((current) => current.filter((task) => getId(task) !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function saveEdit(task) {
    const nextTitle = editingTitle.trim()
    if (!nextTitle) return setError('Title is required.')
    const success = await changeTask(getId(task), {
      title: nextTitle,
      description: editingDescription.trim(),
    })
    if (success) setEditingId(null)
  }

  return (
    <main className="task-page">
      <section className="task-card" aria-labelledby="task-heading">
        <h1 id="task-heading">Task Manager</h1>
        <p>Keep your work organized, enhanced with AI task assistance.</p>

        {error && (
          <p className="task-error" role="alert">
            {error}
          </p>
        )}

        {aiNotice && (
          <p className="ai-notice" role="status">
            {aiNotice}
          </p>
        )}

        <form className="task-form-enhanced" onSubmit={addTask}>
          <div className="input-group">
            <label className="sr-only" htmlFor="task-title">
              Task title
            </label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
            />
            <button
              type="button"
              className="btn-ai"
              onClick={handleGenerateDescription}
              disabled={aiLoading || !title.trim()}
              title="Generate a smart description using AI"
            >
              {aiLoading ? '✨ Thinking...' : '✨ Suggest with AI'}
            </button>
          </div>

          <div className="desc-group">
            <label className="sr-only" htmlFor="task-desc">
              Task description
            </label>
            <textarea
              id="task-desc"
              className="task-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description (optional, or click 'Suggest with AI')"
              rows={2}
            />
            <p className="ai-disclaimer">
              ⚡ <em>AI suggestions are assistive; please review and modify before saving.</em>
            </p>
          </div>

          <button type="submit" className="btn-submit">
            Add task
          </button>
        </form>

        {loading ? (
          <p role="status">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="empty">No tasks yet. Create one above to get started.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => {
              const id = getId(task)
              const isEditing = editingId === id
              return (
                <li key={id} className={task.completed ? 'done' : ''}>
                  <input
                    type="checkbox"
                    checked={Boolean(task.completed)}
                    onChange={() => changeTask(id, { completed: !task.completed })}
                    aria-label={`Complete ${task.title}`}
                  />
                  <div className="task-details">
                    {isEditing ? (
                      <form
                        className="edit-form"
                        onSubmit={(e) => {
                          e.preventDefault()
                          saveEdit(task)
                        }}
                      >
                        <input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Task title"
                          autoFocus
                        />
                        <textarea
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          placeholder="Task description"
                          rows={2}
                        />
                        <div className="edit-actions">
                          <button type="submit">Save</button>
                          <button type="button" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="task-title-line">
                          <span className="task-title-text">{task.title}</span>
                          <button
                            type="button"
                            className="btn-edit"
                            onClick={() => {
                              setEditingId(id)
                              setEditingTitle(task.title || '')
                              setEditingDescription(task.description || '')
                            }}
                          >
                            Edit
                          </button>
                        </div>
                        {task.description && (
                          <p className="task-desc-text">{task.description}</p>
                        )}
                      </>
                    )}
                  </div>
                  <button
                    className="delete"
                    type="button"
                    onClick={() => removeTask(id)}
                    aria-label={`Delete task ${task.title}`}
                  >
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <button className="refresh" type="button" onClick={loadTasks} disabled={loading}>
          Refresh
        </button>
      </section>
    </main>
  )
}
