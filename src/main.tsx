import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { PricingProvider } from './context/PricingContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PricingProvider>
      <App />
    </PricingProvider>
  </React.StrictMode>,
)
