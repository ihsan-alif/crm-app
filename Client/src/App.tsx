import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Transactions from './pages/Transactions'
import TransactionPrint from './pages/TransactionPrint'
import WhatsApp from './pages/WhatsApp'
import ActivityLogs from './pages/ActivityLogs'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/transactions/:id/print" element={<ProtectedRoute><TransactionPrint /></ProtectedRoute>} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/wa" element={<WhatsApp />} />
            <Route path="/activity-logs" element={<ActivityLogs />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
    </BrowserRouter>
  )
}
