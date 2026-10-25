import { useEffect, useState } from 'react'
import { createTask, deleteTask, getTasks, updateTask } from '../api'
import './TaskPage.css'

export default function TaskPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  const getId = (task) => task._id || task.id

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    setLoading(true); setError('')
    try { setTasks(await getTasks()) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function addTask(event) {
    event.preventDefault()
    if (!title.trim()) return setError('Title is required.')
    setError('')
    try {
      const task = await createTask({ title: title.trim(), completed: false })
      setTasks((current) => [task, ...current])
      setTitle('')
    } catch (err) { setError(err.message) }
  }

  async function changeTask(id, changes) {
    setError('')
    try {
      const updated = await updateTask(id, changes)
      setTasks((current) => current.map((task) => getId(task) === id ? updated : task))
      return true
    } catch (err) { setError(err.message); return false }
  }

  async function removeTask(id) {
    if (!window.confirm('Delete this task?')) return
    setError('')
    try {
      await deleteTask(id)
      setTasks((current) => current.filter((task) => getId(task) !== id))
    } catch (err) { setError(err.message) }
  }

  async function saveTitle(task) {
    const nextTitle = editingTitle.trim()
    if (!nextTitle) return setError('Title is required.')
    if (await changeTask(getId(task), { title: nextTitle })) setEditingId(null)
  }

  return <main className="task-page">
    <section className="task-card" aria-labelledby="task-heading">
      <h1 id="task-heading">Task Manager</h1>
      <p>Keep your work clear and manageable.</p>
      {error && <p className="task-error" role="alert">{error}</p>}
      <form className="task-form" onSubmit={addTask}>
        <label className="sr-only" htmlFor="task-title">Task title</label>
        <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs doing?" />
        <button type="submit">Add task</button>
      </form>
      {loading ? <p role="status">Loading...</p> : tasks.length === 0 ? <p className="empty">No tasks yet. Create one to get started.</p> :
        <ul className="task-list">{tasks.map((task) => {
          const id = getId(task)
          return (
            <li key={id} className={task.completed ? 'done' : ''}>
              <input type="checkbox" checked={task.completed} onChange={() => changeTask(id, { completed: !task.completed })} aria-label={`Complete ${task.title}`} />
              <div className="task-name">{editingId === id ? <form onSubmit={(event) => { event.preventDefault(); saveTitle(task) }}>
                <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} autoFocus />
                <button type="submit">Save</button><button type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </form> : <><span>{task.title}</span><button type="button" onClick={() => { setEditingId(id); setEditingTitle(task.title) }}>Edit</button></>}</div>
              <button className="delete" type="button" onClick={() => removeTask(id)}>Delete</button>
            </li>
          )
        })}</ul>}
      <button className="refresh" type="button" onClick={loadTasks} disabled={loading}>Refresh</button>
    </section>
  </main>
}
