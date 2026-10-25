import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

try {
  const storedTheme = localStorage.getItem('savify-theme');
  if (storedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch (e) {
  // Silent fallback for restricted storage access
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)