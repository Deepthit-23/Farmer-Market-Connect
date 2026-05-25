import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { i18nInitPromise } from './i18n'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))

i18nInitPromise.then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
