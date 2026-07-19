function About({ name }) {
  return <section className="section" id="about"><div className="section-heading"><p className="eyebrow">About Me</p><h2>Who I Am</h2></div><div className="about-grid"><div><p>I am a motivated student learning web development. I enjoy building websites that are simple, useful, and visually clear.</p><p>My current focus is improving React, responsive design, and problem-solving skills by turning ideas into real web pages.</p></div><div className="info-box"><p><strong>Name:</strong> {name}</p><p><strong>Email:</strong> princypatel7299@gmail.com</p><p><strong>Location:</strong> Gujarat, India</p><p><strong>Interest:</strong> Full Stack Development</p></div></div></section>
}
export default About
