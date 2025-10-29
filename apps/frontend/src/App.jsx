import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Watch from './pages/Watch.jsx'
import Settings from './pages/Settings.jsx'


export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
	  <Route path="/settings" element={<Settings />} />
          <Route path="/watch" element={<Watch />} />
        </Routes>
      </main>
    </div>
  )
}
