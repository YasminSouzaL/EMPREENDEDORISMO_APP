import { useState } from 'react'
import { LogOut, Moon, Sun, Zap } from 'lucide-react'
import { Button } from '@atoms'
export function Header({ name, school, logo, onLogout }: { name?: string; school?: string; logo?: string; onLogout?: () => void }) {
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark')
  function toggle() { const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light'; try { localStorage.setItem('enigma:student:theme', next ? 'dark' : 'light') } catch { /* Mantém o tema nesta página. */ } }
  return <header className="student-header"><div className="shell flex flex-wrap items-center justify-between gap-3 py-4"><a href="/" className="brand">{logo ? <img src={logo} alt="" className="w-10 h-10 object-contain" /> : <span className="brand-symbol"><Zap size={24} fill="currentColor" /></span>}<span>ava<span className="text-accent">.enigma</span><small>{school ?? 'O universo de quem aprende'}</small></span></a><div className="header-actions"><span className="student-name">{name && <span className="profile-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>}{name?.split(' ')[0]}</span><Button aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'} aria-pressed={dark} onClick={toggle}>{dark ? <Sun size={18} /> : <Moon size={18} />}</Button>{onLogout && <Button onClick={onLogout}><LogOut size={16} /><span>Sair</span></Button>}</div></div></header>
}
