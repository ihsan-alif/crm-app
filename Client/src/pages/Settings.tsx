import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../lib/api'
import type { ApiResponse, User } from '../types'
import { Moon, Sun, Loader2, Check, AlertCircle, Eye, EyeOff, Store, Upload, Users } from 'lucide-react'

export default function Settings() {
  const { user, logout, refreshUser } = useAuth()
  const { isDark, toggle } = useTheme()

  const [tenant, setTenant] = useState<{ name: string; logo_url: string; is_active: boolean } | null>(null)
  const [tenantMsg, setTenantMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [tenantLoading, setTenantLoading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

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

  const [users, setUsers] = useState<User[]>([])
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPass, setNewPass] = useState('')
  const [userMsg, setUserMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  const isAdmin = user?.role === 'admin'

  const fetchUsers = async () => {
    try {
      const res = await api.get<ApiResponse<User[]>>('/users')
      setUsers(res.data.data || [])
    } catch {}
  }

  useEffect(() => {
    api.get<ApiResponse<any>>('/tenant')
      .then((res) => {
        const d = res.data.data
        setTenant({ name: d.name, logo_url: d.logo_url || '', is_active: d.is_active })
      })
      .catch(() => {})
    if (isAdmin) fetchUsers()
  }, [])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserLoading(true)
    setUserMsg(null)
    try {
      await api.post<ApiResponse<any>>('/users', { name: newName, email: newEmail, password: newPass, role: 'sales' })
      setUserMsg({ ok: true, text: 'Akun sales berhasil dibuat. Sales dapat login sendiri.' })
      setNewName(''); setNewEmail(''); setNewPass('')
      await fetchUsers()
    } catch (err: any) {
      setUserMsg({ ok: false, text: err?.response?.data?.error?.message || 'Gagal membuat akun' })
    } finally {
      setUserLoading(false)
    }
  }

  const toggleActive = async (u: User) => {
    try {
      await api.put(`/users/${u.id}/active`, { is_active: !u.is_active })
      setUserMsg({ ok: true, text: 'Status akun diperbarui' })
      await fetchUsers()
    } catch (err: any) {
      setUserMsg({ ok: false, text: err?.response?.data?.error?.message || 'Gagal mengubah status' })
    }
  }

  const resetPassword = async (u: User) => {
    const np = prompt(`Reset password untuk ${u.name}? Masukkan password baru (min. 6 karakter):`)
    if (!np) return
    if (np.length < 6) { setUserMsg({ ok: false, text: 'Password minimal 6 karakter' }); return }
    try {
      await api.put(`/users/${u.id}/password`, { new_password: np })
      setUserMsg({ ok: true, text: 'Password berhasil direset' })
    } catch (err: any) {
      setUserMsg({ ok: false, text: err?.response?.data?.error?.message || 'Gagal reset password' })
    }
  }

  const deleteUser = async (u: User) => {
    if (!window.confirm(`Hapus akun ${u.name}? Akun tidak bisa login lagi.`)) return
    try {
      await api.delete(`/users/${u.id}`)
      setUserMsg({ ok: true, text: 'Akun dihapus' })
      await fetchUsers()
    } catch (err: any) {
      setUserMsg({ ok: false, text: err?.response?.data?.error?.message || 'Gagal menghapus akun' })
    }
  }

  useEffect(() => {
    api.get<ApiResponse<any>>('/tenant')
      .then((res) => {
        const d = res.data.data
        setTenant({ name: d.name, logo_url: d.logo_url || '', is_active: d.is_active })
      })
      .catch(() => {})
  }, [])

  const saveTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    setTenantLoading(true)
    setTenantMsg(null)
    try {
      await api.put<ApiResponse<any>>('/tenant', {
        name: tenant.name,
        is_active: tenant.is_active,
      })
      setTenantMsg({ ok: true, text: 'Pengaturan toko berhasil disimpan' })
      refreshUser()
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Gagal menyimpan pengaturan toko'
      setTenantMsg({ ok: false, text: msg })
    } finally {
      setTenantLoading(false)
    }
  }

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !tenant) return
    setLogoUploading(true)
    setTenantMsg(null)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const res = await api.post<ApiResponse<any>>('/tenant/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setTenant({ ...tenant, logo_url: res.data.data.logo_url || '' })
      setTenantMsg({ ok: true, text: 'Logo berhasil diupload' })
      refreshUser()
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Gagal upload logo'
      setTenantMsg({ ok: false, text: msg })
    } finally {
      setLogoUploading(false)
    }
  }

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
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-blue-600" /> Pengaturan Toko
        </h2>
        {isAdmin && tenant && (
          <form onSubmit={saveTenant} className="space-y-4 max-w-md">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Nama Toko *</label>
              <input
                value={tenant.name}
                onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Logo Toko</label>
              <div className="flex items-center gap-4">
                {tenant.logo_url && (
                  <img src={tenant.logo_url} alt="Logo" className="h-14 w-14 object-contain rounded-lg border dark:border-gray-600 p-1 bg-white" />
                )}
                <label className={`${logoUploading ? 'opacity-60 pointer-events-none' : 'cursor-pointer'} inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg`}>
                  <Upload className="w-4 h-4" />
                  {logoUploading ? 'Mengupload...' : 'Upload Logo'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadLogo} />
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, atau WEBP. Maksimal 2MB.</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>Toko Aktif</span>
              </div>
              <button
                type="button"
                onClick={() => setTenant({ ...tenant, is_active: !tenant.is_active })}
                className={`relative w-12 h-6 rounded-full transition-colors ${tenant.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${tenant.is_active ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            {tenantMsg && (
              <div className={`flex items-center gap-2 text-sm ${tenantMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {tenantMsg.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {tenantMsg.text}
              </div>
            )}
            <button type="submit" disabled={tenantLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {tenantLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan Pengaturan Toko
            </button>
          </form>
        )}
      </div>

      {isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Kelola Pengguna
          </h2>

          <form onSubmit={handleAddUser} className="space-y-4 max-w-md mb-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Tambah Akun Sales</h3>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Nama</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Password Awal</label>
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className={inputClass} required minLength={6} />
              <p className="text-xs text-gray-400 mt-1">Sales akan login sendiri memakai email & password ini, lalu bisa ganti password di Profil.</p>
            </div>
            <button type="submit" disabled={userLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {userLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Tambah Sales
            </button>
            {userMsg && (
              <div className={`flex items-center gap-2 text-sm ${userMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {userMsg.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {userMsg.text}
              </div>
            )}
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-2 pr-4">Nama</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.filter((u) => u.id === user?.id || u.role === 'sales').map((u) => (
                  <tr key={u.id} className="border-t dark:border-gray-700">
                    <td className="py-2 pr-4 font-medium">{u.name} {u.id === user?.id && <span className="text-xs text-gray-400">(Anda)</span>}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4 capitalize">{u.role}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => toggleActive(u)} disabled={u.id === user?.id}
                          className="text-xs px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">
                          {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button type="button" onClick={() => resetPassword(u)} disabled={u.id === user?.id}
                          className="text-xs px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">
                          Reset Password
                        </button>
                        <button type="button" onClick={() => deleteUser(u)} disabled={u.id === user?.id}
                          className="text-xs px-2 py-1 rounded border text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-40">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
