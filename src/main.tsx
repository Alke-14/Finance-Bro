import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import About from './About'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>  
        <Route path='/' element={<App />} />
        <Route path='/about' element={<About />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
