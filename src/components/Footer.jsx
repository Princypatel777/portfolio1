function Footer({ name, email }) { return <footer className="footer"><p>© {new Date().getFullYear()} {name}. All rights reserved. · <a href={`mailto:${email}`}>{email}</a></p></footer> }
export default Footer
