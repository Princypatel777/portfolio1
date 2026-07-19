import About from './About'
import Header from './Header'
import Resume from './Resume'
import Skills from './Skills'

const skillList = [['HTML', 'Semantic page structure, forms, links, images, and clean markup.'], ['CSS', 'Layouts, colors, spacing, typography, and responsive design.'], ['React', 'Reusable components, JSX, props, and component composition.'], ['JavaScript', 'Programming fundamentals and beginner-level interaction logic.']]

function Home() {
  return <><Header name="Princy Patel" role="Software Developer" /><About name="Princy Patel" /><Skills skillList={skillList} /><Resume /></>
}

export default Home
