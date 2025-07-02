import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { Home, User, Shield, Upload, ListChecks, LogOut, Image, CheckCircle, XCircle, Clock } from "lucide-react"

const Sidebar = () => {
  const { user, isAdmin, logout, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) return null

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { to: "/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
    ...(isAdmin ? [{ to: "/admin/upload-task", label: "Upload Task Image", icon: <Upload className="h-5 w-5" /> }] : []),
    { to: "/admin/responses", label: "User Responses", icon: <ListChecks className="h-5 w-5" /> },
  ]

  const userLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { to: "/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
    { to: "/responses", label: "Responses", icon: <ListChecks className="h-5 w-5" /> },
  ]

  const responseStatuses = [
    { label: "Pending", icon: <Clock className="h-4 w-4 text-yellow-500" /> },
    { label: "Approved", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
    { label: "Rejected", icon: <XCircle className="h-4 w-4 text-red-500" /> },
  ]

  return (
    <aside className="h-full w-64 bg-gradient-to-b from-blue-600 to-blue-400 border-r shadow-2xl flex flex-col py-8 px-5 fixed top-0 left-0 z-40 min-h-screen text-white">
      <div className="flex items-center mb-10 space-x-3">
        <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-20">
          <Image className="h-8 w-8 text-white" />
        </span>
        <span className="text-2xl font-extrabold tracking-tight">ProDash</span>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {(isAdmin ? navLinks : userLinks).map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`flex items-center px-4 py-3 rounded-xl transition-all font-semibold hover:bg-white hover:bg-opacity-10 ${location.pathname === link.to ? "bg-white bg-opacity-20" : ""}`}
              >
                {link.icon}
                <span className="ml-4 text-lg">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        {/* {isAdmin && (
          <>
            <div className="mt-10 mb-3 text-xs font-bold text-white uppercase tracking-widest opacity-70">Admin Controls</div>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all font-semibold hover:bg-white hover:bg-opacity-10 ${location.pathname === link.to ? "bg-white bg-opacity-20" : ""}`}
                  >
                    {link.icon}
                    <span className="ml-4 text-lg">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 mb-2 text-xs font-bold text-white uppercase tracking-widest opacity-70">Responses</div>
            <ul className="space-y-1">
              {responseStatuses.map((status) => (
                <li key={status.label} className="flex items-center px-4 py-2 text-base font-medium rounded-lg bg-white bg-opacity-5">
                  {status.icon}
                  <span className="ml-3">{status.label}</span>
                </li>
              ))}
            </ul>
          </> */}
        {/* )} */}
      </nav>
      <div className="mt-auto pt-8 border-t border-white border-opacity-10">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 rounded-xl text-white font-semibold hover:bg-red-600 hover:bg-opacity-80 transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-4 text-lg">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
