import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// We don't need index.css if we use Tailwind CDN

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)