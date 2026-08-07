import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { LayoutDashboard, Users, Package, Receipt, MessageSquare, Settings, LogOut, Moon, Sun, History } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
  { to: '/customers', icon: Users, label: 'Pelanggan', adminOnly: false },
  { to: '/products', icon: Package, label: 'Produk', adminOnly: false },
  { to: '/transactions', icon: Receipt, label: 'Transaksi', adminOnly: false },
  { to: '/wa', icon: MessageSquare, label: 'WhatsApp', adminOnly: false },
  { to: '/activity-logs', icon: History, label: 'Aktivitas', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'Pengaturan', adminOnly: false },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const visibleNav = (user?.role === 'admin' ? navItems : navItems.filter((i) => !i.adminOnly)).map((i) => {
    const { adminOnly, ...rest } = i
    return rest
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex">
      <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-800 border-r dark:border-gray-700 shadow-sm">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {user?.tenant?.logo_url ? (
              <img src={user.tenant.logo_url} alt="Logo" className="h-8 w-8 object-contain shrink-0" />
            ) : (
              <span className="h-8 w-8 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {(user?.tenant?.name || 'CRM App').charAt(0).toUpperCase()}
              </span>
            )}
            <h1 className="font-bold text-lg text-blue-600 dark:text-blue-400 truncate">{user?.tenant?.name || 'CRM App'}</h1>
          </div>
          <button onClick={toggle} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs capitalize">{user?.role}</p>
            </div>
            <button onClick={logout} className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user?.tenant?.logo_url && <img src={user.tenant.logo_url} alt="Logo" className="h-6 w-6 object-contain" />}
            <h1 className="font-bold text-blue-600 dark:text-blue-400">{user?.tenant?.name || 'CRM App'}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={toggle} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <span className="dark:text-gray-300">{user?.name}</span>
            <button onClick={logout} className="text-red-500 dark:text-red-400 text-xs">Keluar</button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-around py-2">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-xs px-2 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
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
