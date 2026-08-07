import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import type { Transaction, Customer, Product, PaginatedResponse } from '../types'
import { Plus, Loader2, ChevronLeft, ChevronRight, Printer, Pencil } from 'lucide-react'
import ExportButton from '../components/ExportButton'

interface ItemForm {
  product_id: string
  name: string
  qty: number
  price: number
  search: string
  open: boolean
}

export default function Transactions() {
  const [list, setList] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{
    customer_id: string
    status: 'paid' | 'unpaid'
    notes: string
    items: ItemForm[]
  }>({
    customer_id: '',
    status: 'unpaid',
    notes: '',
    items: [{ product_id: '', name: '', qty: 1, price: 0, search: '', open: false }],
  })
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerOpen, setCustomerOpen] = useState(false)
  const [formError, setFormError] = useState('')
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
    setEditingId(null)
    setFormError('')
    setForm({ customer_id: '', status: 'unpaid', notes: '', items: [{ product_id: '', name: '', qty: 1, price: 0, search: '', open: false }] })
    setCustomerSearch('')
    setCustomerOpen(false)
    if (customers.length === 0) {
      const res = await api.get<PaginatedResponse<Customer>>('/customers?per_page=100')
      setCustomers(res.data.data)
    }
    if (products.length === 0) {
      const res = await api.get<PaginatedResponse<Product>>('/products?per_page=100')
      setProducts(res.data.data)
    }
    setShowForm(true)
  }

  const openEdit = async (t: Transaction) => {
    setEditingId(t.id)
    setFormError('')
    setForm({
      customer_id: t.customer_id,
      status: t.status,
      notes: t.notes || '',
      items: t.items?.length
        ? t.items.map((i) => ({ product_id: i.product_id || '', name: i.name, qty: i.qty, price: i.price, search: i.name, open: false }))
        : [{ product_id: '', name: '', qty: 1, price: 0, search: '', open: false }],
    })
    setCustomerSearch(t.customer ? `${t.customer.name} - ${t.customer.phone}` : '')
    setCustomerOpen(false)
    if (customers.length === 0) {
      const res = await api.get<PaginatedResponse<Customer>>('/customers?per_page=100')
      setCustomers(res.data.data)
    }
    if (products.length === 0) {
      const res = await api.get<PaginatedResponse<Product>>('/products?per_page=100')
      setProducts(res.data.data)
    }
    setShowForm(true)
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', name: '', qty: 1, price: 0, search: '', open: false }] })
  const removeItem = (idx: number) => {
    if (form.items.length <= 1) return
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
  }

  const updateItem = (idx: number, field: string, value: any) => {
    const items = form.items.map((item, i) => {
      if (i !== idx) return item
      const qty = field === 'qty' ? value : item.qty
      return { ...item, [field]: value, qty }
    })
    setForm({ ...form, items })
  }

  const updateItemSearch = (idx: number, value: string) => {
    const items = form.items.map((item, i) =>
      i === idx ? { ...item, search: value, open: true } : { ...item, open: false }
    )
    setForm({ ...form, items })
  }

  const setItemOpen = (idx: number, open: boolean) => {
    const items = form.items.map((item, i) => (i === idx ? { ...item, open } : { ...item, open: false }))
    setForm({ ...form, items })
  }

  const selectProduct = (idx: number, p: Product) => {
    const items = form.items.map((item, i) =>
      i === idx ? { ...item, product_id: p.id, name: p.name, price: p.price, search: p.name, open: false } : item
    )
    setForm({ ...form, items })
  }

  const totalForm = form.items.reduce((sum, i) => sum + i.qty * i.price, 0)

  const filteredCustomers = customers.filter((c) =>
    (c.name + ' ' + c.phone).toLowerCase().includes(customerSearch.toLowerCase())
  )

  const filteredProducts = (search: string) =>
    products.filter((p) =>
      (p.name + ' ' + (p.sku || '')).toLowerCase().includes(search.toLowerCase())
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_id) {
      setFormError('Silakan pilih pelanggan')
      return
    }
    if (form.items.some((i) => !i.product_id)) {
      setFormError('Pilih produk untuk setiap item dari daftar')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        customer_id: form.customer_id,
        status: form.status,
        notes: form.notes || null,
        items: form.items.map(i => ({ product_id: i.product_id, qty: i.qty })),
      }
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload)
      } else {
        await api.post('/transactions', payload)
      }
      setShowForm(false)
      setEditingId(null)
setForm({ customer_id: '', status: 'unpaid', notes: '', items: [{ product_id: '', name: '', qty: 1, price: 0, search: '', open: false }] })
      fetch()
    } catch (err: any) {
      setFormError(err?.response?.data?.error?.message || 'Gagal menyimpan transaksi')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.ceil(total / perPage)

  const statusBadge = (s: string) => (
    <span className={`text-xs px-2 py-1 rounded ${s === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
      {s === 'paid' ? 'Lunas' : 'Belum Lunas'}
    </span>
  )

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Transaksi</h1>
        <div className="flex gap-2">
          <ExportButton url="/transactions/export" baseName="transaksi" />
          <button onClick={openForm} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Baru
          </button>
        </div>
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
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-lg">{editingId ? 'Edit Transaksi' : 'Transaksi Baru'}</h2>

            {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pelanggan *</label>
              <input
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setForm({ ...form, customer_id: '' }); setCustomerOpen(true) }}
                onFocus={() => setCustomerOpen(true)}
                placeholder="Ketik untuk mencari atau pilih pelanggan..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {customerOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCustomerOpen(false)} />
                  <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">Tidak ada pelanggan</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setForm({ ...form, customer_id: c.id }); setCustomerSearch(`${c.name} - ${c.phone}`); setCustomerOpen(false) }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-gray-500 text-xs ml-2">{c.phone}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Item</span>
                <button type="button" onClick={addItem} className="text-blue-600 text-sm">+ Tambah item</button>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Item {idx + 1}</span>
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500 text-sm">Hapus</button>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produk *</label>
                    <input
                      value={item.search}
                      onChange={(e) => updateItemSearch(idx, e.target.value)}
                      onFocus={() => setItemOpen(idx, true)}
                      placeholder="Ketik untuk cari produk..."
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      required
                    />
                    {item.open && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setItemOpen(idx, false)} />
                        <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {filteredProducts(item.search).length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-400">Tidak ada produk</div>
                          ) : (
                            filteredProducts(item.search).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => selectProduct(idx, p)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                              >
                                <span className="font-medium">{p.name}</span>
                                <span className="text-gray-500 text-xs ml-2">Rp {p.price.toLocaleString('id-ID')}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
                    <input type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" min={1} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga</label>
                    <input type="number" value={item.price} readOnly className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" placeholder="Otomatis dari produk" />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right font-semibold">Total: Rp {totalForm.toLocaleString('id-ID')}</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'paid' | 'unpaid' })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="unpaid">Belum Lunas</option>
                <option value="paid">Lunas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan transaksi" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="flex-1 border rounded-lg py-2 text-sm">Batal</button>
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
                    <th className="px-4 py-3 font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{t.number}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">Rp {t.total.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(t)} className="text-blue-500 hover:text-blue-700" aria-label="Edit transaksi">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <a
                            href={`/transactions/${t.id}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            <Printer className="w-3.5 h-3.5" /> Cetak
                          </a>
                        </div>
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
                      <div className="flex items-center gap-3">
                        {statusBadge(t.status)}
                        <button onClick={() => openEdit(t)} className="text-blue-500 text-xs flex items-center gap-0.5">
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <a href={`/transactions/${t.id}/print`} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs flex items-center gap-0.5">
                          <Printer className="w-3 h-3" /> Cetak
                        </a>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('id-ID')}</span>
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
