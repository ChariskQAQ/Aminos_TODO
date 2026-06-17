import React from 'react'
import ReactDOM from 'react-dom/client'
import { initTauriApi } from './tauri-api'
import { ThemeProvider } from './hooks/useTheme'
import App from './App'
import './styles/app.css'

initTauriApi()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
