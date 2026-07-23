function RepoCard({ repo }) {
  return (
    <article className="project-card">
      <h3>{repo.name}</h3>
      <p>{repo.description || 'No description available.'}</p>
      <p>Language: {repo.language || 'Not specified'}</p>
      <p>⭐ {repo.stargazers_count ?? 0}</p>
      <a href={repo.html_url} rel="noreferrer" target="_blank">View repository &rarr;</a>
    </article>
  )
}

export default RepoCard
