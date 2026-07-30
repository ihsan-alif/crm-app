import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { ApiResponse, DashboardSummary } from '../types'
import { Users, Receipt, DollarSign, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ApiResponse<DashboardSummary>>('/dashboard/summary')
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

  const cards = [
    { label: 'Total Pelanggan', value: data?.total_customers ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Transaksi', value: data?.total_transactions ?? 0, icon: Receipt, color: 'bg-green-500' },
    { label: 'Pendapatan', value: `Rp ${(data?.total_revenue ?? 0).toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-amber-500' },
  ]

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-white rounded-xl shadow-sm border p-6 text-center text-gray-400">
        <p className="text-lg">Mulai dengan menambahkan pelanggan pertama Anda</p>
        <p className="text-sm mt-1">Klik menu Pelanggan di sidebar</p>
      </div>
    </div>
  )
}
