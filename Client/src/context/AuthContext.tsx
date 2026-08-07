import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../lib/api'
import type { User, LoginResponse, ApiResponse } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (tenantName: string, name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get<ApiResponse<User>>('/users/me')
        .then((res) => setUser(res.data.data!))
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password })
    localStorage.setItem('access_token', data.data!.access_token)
    localStorage.setItem('refresh_token', data.data!.refresh_token)
    setUser(data.data!.user)
  }

  const register = async (tenantName: string, name: string, email: string, password: string) => {
    await api.post('/auth/register', {
      tenant_name: tenantName,
      name,
      email,
      password,
    })
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    window.location.href = '/login'
  }

  const refreshUser = async () => {
    const res = await api.get<ApiResponse<User>>('/users/me')
    setUser(res.data.data!)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
