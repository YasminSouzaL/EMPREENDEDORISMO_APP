import { Suspense, useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { PublicLayout } from '@organisms/PublicLayout'
import { Access } from './public/Access'
import { About } from './public/About'
import { Home } from './public/Home'
import '@styles/public.css'


export function App() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return <>
    <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <Suspense fallback={<p className="route-loading" role="status">Carregando portal…</p>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="sobre" element={<About />} />
          <Route path="entrar" element={<Access key="login" />} />
          <Route path="cadastro" element={<Access key="register" registration />} />
          <Route path="*" element={<div className="public-container public-section"><h1>Página não encontrada</h1><Link className="text-link" to="/">Voltar ao início</Link></div>} />
        </Route>
      </Routes>
    </Suspense>
  </>
}
