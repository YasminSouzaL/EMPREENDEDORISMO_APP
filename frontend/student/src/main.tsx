import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '@app'
import '@styles/global.css'
try { document.documentElement.dataset.theme = localStorage.getItem('enigma:student:theme') ?? 'light' } catch { document.documentElement.dataset.theme = 'light' }
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
