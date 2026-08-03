import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../lib/api'
import type { ApiResponse } from '../types'
import { Moon, Sun, Loader2, Check, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function Settings() {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useTheme()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showOldPw, setShowOldPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMsg(null)
    try {
      await api.put<ApiResponse<any>>('/users/me', { name, email })
      setProfileMsg({ ok: true, text: 'Profil berhasil disimpan. Silakan login ulang.' })
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Gagal menyimpan profil'
      setProfileMsg({ ok: false, text: msg })
    } finally {
      setProfileLoading(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwLoading(true)
    setPwMsg(null)
    try {
      await api.put<ApiResponse<any>>('/users/password', { old_password: oldPw, new_password: newPw })
      setPwMsg({ ok: true, text: 'Password berhasil diubah' })
      setOldPw('')
      setNewPw('')
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Gagal mengubah password'
      setPwMsg({ ok: false, text: msg })
    } finally {
      setPwLoading(false)
    }
  }

  const inputClass = 'w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'

  const toggleBtn = 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none'

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Pengaturan</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Profil Akun</h2>
        <form onSubmit={saveProfile} className="space-y-4 max-w-md">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Nama</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
          </div>
          {profileMsg && (
            <div className={`flex items-center gap-2 text-sm ${profileMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {profileMsg.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {profileMsg.text}
            </div>
          )}
          <button type="submit" disabled={profileLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Ubah Password</h2>
        <form onSubmit={changePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Password Lama</label>
            <div className="relative">
              <input type={showOldPw ? 'text' : 'password'} value={oldPw} onChange={(e) => setOldPw(e.target.value)} className={inputClass} required />
              <button type="button" onClick={() => setShowOldPw(!showOldPw)} className={toggleBtn} aria-label={showOldPw ? 'Sembunyikan password' : 'Tampilkan password'}>
                {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Password Baru</label>
            <div className="relative">
              <input type={showNewPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputClass} required minLength={6} />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} className={toggleBtn} aria-label={showNewPw ? 'Sembunyikan password' : 'Tampilkan password'}>
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {pwMsg && (
            <div className={`flex items-center gap-2 text-sm ${pwMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {pwMsg.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {pwMsg.text}
            </div>
          )}
          <button type="submit" disabled={pwLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Ubah Password
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Tampilan</h2>
        <div className="flex items-center justify-between max-w-md">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <span className="text-sm text-gray-600 dark:text-gray-300">Mode Gelap</span>
          </div>
          <button onClick={toggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
