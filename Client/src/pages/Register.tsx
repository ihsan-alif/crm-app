import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [tenantName, setTenantName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(tenantName, name, email, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Pendaftaran gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">CRM App</h1>
          <p className="text-gray-500 mt-1">Daftar gratis, kelola pelanggan lebih baik</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Daftar UMKM Baru</h2>
          {success && (
            <p className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded">
              Pendaftaran berhasil! Mengarahkan ke halaman login...
            </p>
          )}
          {error && (
            <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama UMKM / Toko
            </label>
            <input
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Toko ABC"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Admin</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Nama Anda"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="admin@tokoabc.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {success ? 'Berhasil!' : loading ? 'Memproses...' : 'Daftar Gratis'}
          </button>
          <p className="text-sm text-center text-gray-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Masuk
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
