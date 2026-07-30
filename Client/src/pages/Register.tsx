import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, Navigate } from 'react-router-dom'

export default function Register() {
  const { register, user } = useAuth()
  const [tenantName, setTenantName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(tenantName, name, email, password)
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
          <h1 className="text-3xl font-bold text-blue-600">Qasir CRM</h1>
          <p className="text-gray-500 mt-1">Daftar gratis, kelola pelanggan lebih baik</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Daftar UMKM Baru</h2>
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? 'Memproses...' : 'Daftar Gratis'}
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
