function ErrorMessage({ message, onRetry }) {
  return (
    <div className="project-card" role="alert">
      <p>{message}</p>
      <button className="btn secondary" onClick={onRetry} type="button">Retry</button>
    </div>
  )
}

export default ErrorMessage
