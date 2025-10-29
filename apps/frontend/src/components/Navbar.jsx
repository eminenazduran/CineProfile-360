import { Link, NavLink } from "react-router-dom"

const linkBase =
  "px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium text-gray-200 no-underline"

export default function Navbar() {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold tracking-wide text-gray-100 no-underline">
          CineProfile 360
        </Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/" className={({isActive}) => `${linkBase} ${isActive ? "bg-gray-800" : ""}`}>
            Anasayfa
          </NavLink>
          <NavLink to="/watch" className={({isActive}) => `${linkBase} ${isActive ? "bg-gray-800" : ""}`}>
            İzleme
          </NavLink>
          <NavLink to="/settings" className={({isActive}) => `${linkBase} ${isActive ? "bg-gray-800" : ""}`}>
            Ayarlar
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
