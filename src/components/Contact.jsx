import { useState } from 'react'

function Contact({ email }) {
  const [message, setMessage] = useState('')
  const [isHelpVisible, setIsHelpVisible] = useState(false)

  return <section className="section"><div className="section-heading"><p className="eyebrow">Contact</p><h2>Get In Touch</h2></div><div className="contact-grid"><article className="contact-card"><h3>Email</h3><p>{email}</p></article><article className="contact-card"><h3>Phone</h3><p>+91 83207 25376</p></article><article className="contact-card"><h3>LinkedIn</h3><p>linkedin.com/in/princy-patel</p></article></div><form className="contact-form" onSubmit={(event) => event.preventDefault()}><input placeholder="Your Name" aria-label="Your Name" /><input type="email" placeholder="Your Email" aria-label="Your Email" /><textarea rows="5" placeholder="Your Message" aria-label="Your Message" value={message} onChange={(event) => setMessage(event.target.value)} /><p className="character-count" aria-live="polite">{message.length} character{message.length === 1 ? '' : 's'} entered</p><button className="help-button" type="button" onClick={() => setIsHelpVisible((current) => !current)} aria-expanded={isHelpVisible}>{isHelpVisible ? 'Hide writing help' : 'Show writing help'}</button>{isHelpVisible && <p className="help-text">Tell me a little about your project, question, or collaboration idea.</p>}<button type="submit">Send Message</button></form></section>
}

export default Contact
