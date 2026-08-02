import { useCallback, useEffect, useState } from 'react'
import ErrorMessage from './ErrorMessage'
import RepoCard from './RepoCard'
import Spinner from './Spinner'

const REPOSITORIES_URL = 'https://api.github.com/users/Princypatel777/repos'

function Projects() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchRepositories = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(REPOSITORIES_URL)

      if (!response.ok) {
        throw new Error('Unable to load repositories.')
      }

      const repositoryData = await response.json()
      setRepos(repositoryData)
    } catch {
      setError('Unable to load repositories. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRepositories()
  }, [fetchRepositories])

  const filteredRepos = repos.filter((repo) =>
    repo.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <section className="section">
      <div className="section-heading">
        <p className="eyebrow">My Work</p>
        <h2>Projects</h2>
      </div>

      <div className="contact-form" style={{ margin: '0 auto 34px' }}>
        <input
          aria-label="Search repositories"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search repositories..."
          type="search"
          value={searchTerm}
        />
      </div>

      {loading && <Spinner />}
      {!loading && error && <ErrorMessage message={error} onRetry={fetchRepositories} />}
      {!loading && !error && (
        <div className="projects-grid">
          {filteredRepos.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
        </div>
      )}
    </section>
  )
}

export default Projects
