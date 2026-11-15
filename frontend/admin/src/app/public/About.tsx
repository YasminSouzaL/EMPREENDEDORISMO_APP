import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { rotors } from '@assets'

const values = [
  ['Clareza', 'Horários, turmas e responsabilidades precisam estar ao alcance de quem organiza a rotina escolar.'],
  ['Colaboração', 'Direção, professores e equipe trabalham sobre a mesma rotina, com visões adequadas a cada função.'],
  ['Cuidado', 'Cada escola tem sua identidade e seu jeito de trabalhar. O portal dá espaço para os dois.'],
]

export function About() {
  return <>
    <section className="public-hero">
      <div className="public-container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><span className="accent-dot" /> Sobre nós</p>
          <h1>Conheça o <em>Enigma.</em></h1>
          <p className="hero-description">Criamos ferramentas para conectar o planejamento da direção à rotina de professores e equipes escolares.</p>
        </div>
        <img className="about-art" src={rotors} width="620" height="480" alt="Ilustração de três rotores da máquina Enigma" />
      </div>
    </section>
    <section className="public-container public-section">
      <p className="eyebrow">01 / Nossos valores</p>
      <h2>Como pensamos a gestão escolar.</h2>
      <div className="service-grid">
        {values.map(([title, description], index) => <article className="service-card" key={title}>
          <p className="eyebrow">0{index + 1}</p><h3>{title}</h3><p>{description}</p>
        </article>)}
      </div>
      <Link to="/cadastro" className="action-link">Cadastrar escola <ArrowRight size={17} /></Link>
    </section>
  </>
}
