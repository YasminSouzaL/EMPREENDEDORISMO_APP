import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PortalProvider } from '@context'
import { App } from '@app'
import '@styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PortalProvider><App /></PortalProvider>
    </BrowserRouter>
  </StrictMode>,
)
