import React from 'react'
import ReactDOM from 'react-dom/client'
import { initTauriApi } from './tauri-api'
import { CalendarApp } from './CalendarApp'

initTauriApi()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CalendarApp onClose={() => {}} onAddTodo={() => {}} />
  </React.StrictMode>
)
