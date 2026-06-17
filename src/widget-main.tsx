import React from 'react'
import ReactDOM from 'react-dom/client'
import { initTauriApi } from './tauri-api'
import { ThemeProvider } from './hooks/useTheme'
import WidgetApp from './WidgetApp'
import './styles/widget.css'

initTauriApi()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <WidgetApp />
    </ThemeProvider>
  </React.StrictMode>
)
