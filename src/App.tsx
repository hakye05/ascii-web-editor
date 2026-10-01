import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'

import EditorPage from './pages/editor/EditorPage'
import AboutPage from './pages/about/AboutPage'
import ChangelogPage from './pages/changelog/ChangelogPage'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='' element={<EditorPage />} />

        <Route path='/about' element={<AboutPage />} />

        <Route path='/changelog' element={<ChangelogPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
