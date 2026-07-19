import { Link } from 'react-router-dom'

const projects = [['01', 'Personal Portfolio', 'A responsive personal portfolio made with React and CSS.'], ['02', 'Landing Page', 'A clean landing page with a hero section and call-to-action buttons.'], ['03', 'Contact Form', 'A friendly contact form design with accessible input fields.']]

function Projects() {
  return <section className="section"><div className="section-heading"><p className="eyebrow">My Work</p><h2>Projects</h2></div><div className="projects-grid">{projects.map(([number, title, description]) => <article className="project-card" key={number}><span className="project-number">{number}</span><h3>{title}</h3><p>{description}</p><Link to="/contact">Discuss this project &rarr;</Link></article>)}</div></section>
}

export default Projects
