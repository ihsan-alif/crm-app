import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import type { Transaction, Customer, ApiResponse, PaginatedResponse } from '../types'
import { Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Transactions() {
  const [list, setList] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customer_id: 0,
    status: 'unpaid' as 'paid' | 'unpaid',
    notes: '',
    items: [{ name: '', qty: 1, price: 0 }],
  })
  const perPage = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
      if (status) params.set('status', status)
      const res = await api.get<PaginatedResponse<Transaction>>(`/transactions?${params}`)
      setList(res.data.data)
      setTotal(res.data.meta.total)
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { fetch() }, [fetch])

  const openForm = async () => {
    const res = await api.get<PaginatedResponse<Customer>>('/customers?per_page=100')
    setCustomers(res.data.data)
    setShowForm(true)
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { name: '', qty: 1, price: 0 }] })
  const removeItem = (idx: number) => {
    if (form.items.length <= 1) return
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
  }

  const updateItem = (idx: number, field: string, value: any) => {
    const items = form.items.map((item, i) => {
      if (i !== idx) return item
      const qty = field === 'qty' ? value : item.qty
      const price = field === 'price' ? value : item.price
      return { ...item, [field]: value, qty, price }
    })
    setForm({ ...form, items })
  }

  const totalForm = form.items.reduce((sum, i) => sum + i.qty * i.price, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/transactions', {
        ...form,
        items: form.items.map(i => ({ ...i, subtotal: i.qty * i.price })),
      })
      setShowForm(false)
      setForm({ customer_id: 0, status: 'unpaid', notes: '', items: [{ name: '', qty: 1, price: 0 }] })
      fetch()
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (id: number, current: string) => {
    const newStatus = current === 'paid' ? 'unpaid' : 'paid'
    await api.put(`/transactions/${id}/status`, { status: newStatus })
    fetch()
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Transaksi</h1>
        <button onClick={openForm} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Baru
        </button>
      </div>

      <div className="mb-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="border rounded-lg px-3 py-2 text-sm outline-none">
          <option value="">Semua status</option>
          <option value="paid">Lunas</option>
          <option value="unpaid">Belum Lunas</option>
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-lg">Transaksi Baru</h2>

            <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" required>
              <option value="">Pilih pelanggan</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Item</span>
                <button type="button" onClick={addItem} className="text-blue-600 text-sm">+ Tambah item</button>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="Nama item" className="flex-1 border rounded-lg px-3 py-2 text-sm" required />
                  <input type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} className="w-16 border rounded-lg px-3 py-2 text-sm" min={1} required />
                  <input type="number" value={item.price} onChange={(e) => updateItem(idx, 'price', Number(e.target.value))} className="w-24 border rounded-lg px-3 py-2 text-sm" min={0} required />
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-500 px-1 py-2 text-sm">×</button>
                </div>
              ))}
            </div>

            <div className="text-right font-semibold">Total: Rp {totalForm.toLocaleString('id-ID')}</div>

            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'paid' | 'unpaid' })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="unpaid">Belum Lunas</option>
              <option value="paid">Lunas</option>
            </select>

            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Belum ada transaksi</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">No</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Tanggal</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Total</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{t.number}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">Rp {t.total.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleStatus(t.id, t.status)} className={`text-xs px-2 py-1 rounded ${t.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {t.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y">
              {list.map((t) => (
                <div key={t.id} className="px-4 py-3">
                  <p className="font-mono text-xs text-gray-500">{t.number}</p>
                  <p className="font-medium">Rp {t.total.toLocaleString('id-ID')}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('id-ID')}</span>
                    <button onClick={() => toggleStatus(t.id, t.status)} className={`text-xs px-2 py-1 rounded ${t.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {t.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>{total} transaksi</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
