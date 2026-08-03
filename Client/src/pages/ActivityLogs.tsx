import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import type { ActivityLog, PaginatedResponse } from '../types'
import { Loader2, ChevronLeft, ChevronRight, History, LogIn, UserPlus, UserCheck, Trash2, RefreshCw, Send, Megaphone, FileUp } from 'lucide-react'

const actionMeta: Record<string, { label: string; icon: any; color: string }> = {
  login: { label: 'Login', icon: LogIn, color: 'bg-blue-100 text-blue-700' },
  register: { label: 'Registrasi', icon: UserPlus, color: 'bg-purple-100 text-purple-700' },
  create: { label: 'Tambah', icon: UserCheck, color: 'bg-green-100 text-green-700' },
  update: { label: 'Ubah', icon: RefreshCw, color: 'bg-amber-100 text-amber-700' },
  delete: { label: 'Hapus', icon: Trash2, color: 'bg-red-100 text-red-700' },
  send: { label: 'Kirim', icon: Send, color: 'bg-green-100 text-green-700' },
  broadcast: { label: 'Broadcast', icon: Megaphone, color: 'bg-blue-100 text-blue-700' },
  import: { label: 'Import', icon: FileUp, color: 'bg-cyan-100 text-cyan-700' },
}

const entityLabel: Record<string, string> = {
  auth: 'Akun',
  customer: 'Pelanggan',
  transaction: 'Transaksi',
  whatsapp: 'WhatsApp',
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<PaginatedResponse<ActivityLog>>(`/activity-logs?page=${page}&per_page=${perPage}`)
      setLogs(res.data.data)
      setTotal(res.data.meta.total)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  const totalPages = Math.ceil(total / perPage)
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const badge = (action: string) => {
    const meta = actionMeta[action] || { label: action, icon: History, color: 'bg-gray-100 text-gray-700' }
    const Icon = meta.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.color}`}>
        <Icon className="w-3 h-3" /> {meta.label}
      </span>
    )
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Aktivitas Log</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Belum ada aktivitas</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Waktu</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Pengguna</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Aksi</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Modul</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtTime(log.created_at)}</td>
                      <td className="px-4 py-3">{log.user?.name || 'Sistem'}</td>
                      <td className="px-4 py-3">{badge(log.action)}</td>
                      <td className="px-4 py-3 text-gray-600">{entityLabel[log.entity] || log.entity}</td>
                      <td className="px-4 py-3 text-gray-700">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y">
              {logs.map((log) => (
                <div key={log.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{fmtTime(log.created_at)}</span>
                    {badge(log.action)}
                  </div>
                  <p className="text-sm">{log.description}</p>
                  <p className="text-xs text-gray-500">oleh {log.user?.name || 'Sistem'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>{total} aktivitas</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
