import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, Receipt, MessageSquare, Settings, LogOut } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Pelanggan' },
  { to: '/transactions', icon: Receipt, label: 'Transaksi' },
  { to: '/wa', icon: MessageSquare, label: 'WhatsApp' },
  { to: '/settings', icon: Settings, label: 'Pengaturan' },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex flex-col w-56 bg-white border-r shadow-sm">
        <div className="p-4 border-b">
          <h1 className="font-bold text-lg text-blue-600">Qasir CRM</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
            </div>
            <button onClick={logout} className="p-1 text-gray-400 hover:text-red-500">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-blue-600">Qasir CRM</h1>
          <div className="flex items-center gap-2 text-sm">
            <span>{user?.name}</span>
            <button onClick={logout} className="text-red-500 text-xs">Keluar</button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-xs px-2 ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
