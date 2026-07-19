function Skills({ skillList }) {
  return <section className="section muted" id="skills"><div className="section-heading"><p className="eyebrow">My Skills</p><h2>What I Know</h2></div><div className="skills-grid">{skillList.map(([title, description]) => <article className="skill-card" key={title}><h3>{title}</h3><p>{description}</p></article>)}</div></section>
}
export default Skills
