import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import type { Product, PaginatedResponse } from '../types'
import { Search, Plus, Loader2, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', price: '', sku: '', description: '', category: '', is_active: true })
  const [saving, setSaving] = useState(false)
  const perPage = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
      if (search) params.set('search', search)
      const res = await api.get<PaginatedResponse<Product>>(`/products?${params}`)
      setProducts(res.data.data)
      setTotal(res.data.meta.total)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        sku: form.sku || null,
        description: form.description || null,
        category: form.category || null,
        is_active: form.is_active,
      }
      if (editingId) {
        await api.put(`/products/${editingId}`, payload)
      } else {
        await api.post('/products', payload)
      }
      setShowForm(false)
      setEditingId(null)
      setForm({ name: '', price: '', sku: '', description: '', category: '', is_active: true })
      fetch()
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (p: Product) => {
    setForm({ name: p.name, price: String(p.price), sku: p.sku || '', description: p.description || '', category: p.category || '', is_active: p.is_active })
    setEditingId(p.id)
    setShowForm(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: '', price: '', sku: '', description: '', category: '', is_active: true })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus produk ini?')) return
    await api.delete(`/products/${id}`)
    fetch()
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Produk</h1>
        <button onClick={openCreate} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Cari nama / SKU..."
          className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-semibold text-lg">{editingId ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama produk" className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga *</label>
              <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Kode Produk</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Contoh: SKU-001" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Contoh: Elektronik" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi produk" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
                Produk aktif
              </label>
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
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Belum ada produk</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Nama</th>
                    <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Kategori</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Harga</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.sku || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.category || '-'}</td>
                      <td className="px-4 py-3">Rp {p.price.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">
                        {p.is_active
                          ? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">Aktif</span>
                          : <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">Nonaktif</span>}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y">
              {products.map((p) => (
                <div key={p.id} className="px-4 py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-gray-500">Rp {p.price.toLocaleString('id-ID')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {p.category && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">{p.category}</span>}
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-blue-500 text-xs">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 text-xs">Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>{total} produk</span>
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
