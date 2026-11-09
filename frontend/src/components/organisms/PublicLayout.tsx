import { ArrowUpRight } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Brand } from '@atoms'

export function PublicLayout() {
  return <div className="public-shell">
    <header className="public-header">
      <div className="public-container header-inner">
        <Brand />
        <nav aria-label="Navegação pública">
          <NavLink end to="/">Início</NavLink>
          <NavLink to="/sobre">Sobre nós</NavLink>
          <Link className="public-access" to="/entrar">Acessar portal <ArrowUpRight size={16} /></Link>
        </nav>
      </div>
    </header>
    <main id="conteudo" tabIndex={-1}><Outlet /></main>
    <footer className="public-footer">
      <div className="public-container footer-inner">
        <Brand />
        <p>Gestão escolar para quem faz a escola acontecer.</p>
        <Link to="/sobre">Sobre o Enigma <ArrowUpRight size={14} /></Link>
      </div>
    </footer>
  </div>
}
