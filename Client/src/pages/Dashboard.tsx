import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { ApiResponse, DashboardData, Transaction } from '../types'
import { Users, Receipt, DollarSign, Loader2, ArrowRight, Package } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const statusLabel: Record<string, string> = { paid: 'Lunas', unpaid: 'Piutang' }
const statusColor: Record<string, string> = { paid: 'text-green-600 bg-green-50', unpaid: 'text-amber-600 bg-amber-50' }

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ApiResponse<DashboardData>>('/dashboard')
      .then((res) => setData(res.data.data!))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  const summary = data?.summary
  const fmt = (n?: number) => (n ?? 0).toLocaleString('id-ID')

  const cards = [
    { label: 'Total Pelanggan', value: fmt(summary?.total_customers), icon: Users, color: 'bg-blue-500', link: '/customers' },
    { label: 'Total Transaksi', value: fmt(summary?.total_transactions), icon: Receipt, color: 'bg-green-500', link: '/transactions' },
    { label: 'Pendapatan', value: `Rp ${fmt(summary?.total_revenue)}`, icon: DollarSign, color: 'bg-amber-500', link: '/transactions' },
  ]

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Pendapatan 7 Hari</h2>
          </div>
          {data?.revenue_chart && data.revenue_chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.revenue_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `Rp${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`Rp ${Number(v).toLocaleString('id-ID')}`, 'Pendapatan']} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Belum ada data transaksi</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Transaksi Terbaru</h2>
            <Link to="/transactions" className="text-blue-600 text-sm flex items-center gap-1">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.recent_transactions && data.recent_transactions.length > 0 ? (
            <div className="space-y-3">
              {data.recent_transactions.slice(0, 5).map((t: Transaction) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {t.number || `#${t.id}`}
                    </p>
                    <p className="text-xs text-gray-400">{t.customer?.name || 'Walk-in'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">Rp {(t.total ?? 0).toLocaleString('id-ID')}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${statusColor[t.status] || ''}`}>
                      {statusLabel[t.status] || t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Package className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-gray-400 text-sm mt-2">Belum ada transaksi</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Pelanggan Terbaru</h2>
          <Link to="/customers" className="text-blue-600 text-sm flex items-center gap-1">
            Lihat semua <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {data?.recent_customers && data.recent_customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-2 font-medium">Nama</th>
                  <th className="pb-2 font-medium">Telepon</th>
                  <th className="pb-2 font-medium">Bergabung</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2.5 text-gray-700">{c.name}</td>
                    <td className="py-2.5 text-gray-500">{c.phone || '-'}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <Users className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-gray-400 text-sm mt-2">Belum ada pelanggan</p>
            <Link to="/customers" className="text-blue-600 text-sm mt-1 inline-block">Tambah pelanggan</Link>
          </div>
        )}
      </div>
    </div>
  )
}
