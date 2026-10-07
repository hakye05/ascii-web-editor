import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

import EditorPage from './pages/editor/EditorPage'
import AboutPage from './pages/about/AboutPage'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<EditorPage />} />
        <Route path='/about' element={<AboutPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
