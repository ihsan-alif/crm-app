import { useAuth } from '../context/AuthContext'
import { Settings as SettingsIcon } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Pengaturan</h1>
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <h2 className="font-semibold">Profil Akun</h2>
        <div className="text-sm space-y-2">
          <p><span className="text-gray-500">Nama:</span> {user?.name}</p>
          <p><span className="text-gray-500">Email:</span> {user?.email}</p>
          <p><span className="text-gray-500">Role:</span> <span className="capitalize">{user?.role}</span></p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400 mt-4">
        <SettingsIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg">Pengaturan lainnya akan segera hadir</p>
        <p className="text-sm mt-1">Konfigurasi WA API, Email, dan profil UMKM</p>
      </div>
    </div>
  )
}
