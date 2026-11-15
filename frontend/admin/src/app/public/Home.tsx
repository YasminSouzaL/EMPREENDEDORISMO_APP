import { ArrowDown, ArrowRight, BookOpen, CalendarDays, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { calendarPreview, classroomPreview, enigma, keyboard, rotors, teamPreview } from '@assets'
import { Carousel } from '@molecules'

const machineSlides = [
  { src: enigma, alt: 'Ilustração da máquina de cifragem Enigma em uma caixa de madeira', caption: 'A máquina Enigma' },
  { src: rotors, alt: 'Três rotores ilustrados lado a lado', caption: 'Conjunto de rotores' },
  { src: keyboard, alt: 'Ilustração das teclas circulares da máquina Enigma', caption: 'Teclado de entrada' },
]

const workspaceSlides = [
  { src: calendarPreview, alt: 'Ilustração de um calendário com dias marcados', caption: 'Agenda escolar' },
  { src: classroomPreview, alt: 'Ilustração de nove mesas organizadas em uma turma', caption: 'Mapa de turmas' },
  { src: teamPreview, alt: 'Ilustração da lista de profissionais com seus cargos', caption: 'Equipe escolar' },
]

const services = [
  { icon: CalendarDays, title: 'Calendário letivo', description: 'Organize dias de aula, feriados e férias em uma agenda compartilhada pela equipe.' },
  { icon: BookOpen, title: 'Disciplinas e turmas', description: 'Consulte horários, acompanhe a composição das turmas e prepare atividades por disciplina.' },
  { icon: UsersRound, title: 'Gestão de integrantes', description: 'Cadastre alunos, organize a equipe e vincule professores às disciplinas e turmas.' },
]

export function Home() {
  return <>
    <section className="public-hero">
      <div className="public-container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><span className="accent-dot" /> Portal de gestão escolar</p>
          <h1>A escola em<br /> <em>sintonia.</em></h1>
          <p className="hero-description">Um espaço para organizar a rotina escolar. Reúna a agenda, as turmas e a equipe em um só portal.</p>
          <div className="hero-actions">
            <Link to="/cadastro" className="action-link">Cadastrar escola <ArrowRight size={17} /></Link>
            <a href="#recursos" className="text-link">Conhecer recursos <ArrowDown size={15} /></a>
          </div>
        </div>
        <Carousel slides={machineSlides} label="Ilustrações da máquina Enigma" eager />
      </div>
    </section>
    <section id="recursos" className="public-container public-section">
      <p className="eyebrow">01 / O que fazemos</p>
      <h2>O essencial para o dia a dia.</h2>
      <p className="section-intro">O Enigma reúne as ferramentas que a direção e os professores usam para coordenar a rotina da escola.</p>
      <div className="service-grid">
        {services.map(({ icon: Icon, title, description }, index) => <article className="service-card" key={title}>
          <div className="service-icon"><Icon size={20} /><span>0{index + 1}</span></div>
          <h3>{title}</h3><p>{description}</p>
        </article>)}
      </div>
    </section>
    <section className="workspace-section">
      <div className="public-container public-section workspace-grid">
        <div>
          <p className="eyebrow">02 / Por dentro do portal</p>
          <h2>Do calendário à sala de aula.</h2>
          <p className="section-intro">Consulte as próximas datas, encontre uma turma e veja quem faz parte dela. Cada integrante acessa os espaços ligados à sua função.</p>
          <Link className="text-link" to="/entrar">Acessar o portal <ArrowRight size={17} /></Link>
        </div>
        <Carousel slides={workspaceSlides} label="Ilustrações dos recursos do portal" />
      </div>
    </section>
  </>
}
