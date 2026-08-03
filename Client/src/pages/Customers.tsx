import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../lib/api'
import type { Customer, PaginatedResponse } from '../types'
import { Search, Plus, Loader2, Trash2, Pencil, ChevronLeft, ChevronRight, Upload, Download, FileDown } from 'lucide-react'
import { downloadFile } from '../lib/api'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', tag: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const perPage = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
      if (search) params.set('search', search)
      if (tag) params.set('tag', tag)
      const res = await api.get<PaginatedResponse<Customer>>(`/customers?${params}`)
      setCustomers(res.data.data)
      setTotal(res.data.meta.total)
    } finally {
      setLoading(false)
    }
  }, [page, search, tag])

  useEffect(() => { fetch() }, [fetch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, form)
      } else {
        await api.post('/customers', form)
      }
      setShowForm(false)
      setEditingId(null)
      setForm({ name: '', phone: '', email: '', address: '', tag: '', notes: '' })
      fetch()
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (c: Customer) => {
    setForm({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '', tag: c.tag || '', notes: c.notes || '' })
    setEditingId(c.id)
    setShowForm(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: '', phone: '', email: '', address: '', tag: '', notes: '' })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pelanggan ini?')) return
    await api.delete(`/customers/${id}`)
    fetch()
  }

  const handleExport = () => {
    downloadFile('/customers/export', 'pelanggan.csv')
  }

  const handleDownloadTemplate = () => {
    downloadFile('/customers/template', 'template_pelanggan.csv')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/customers/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImportResult(res.data.data)
    } catch {
      setImportResult({ success: 0, failed: 1, errors: ['Gagal mengupload file'] })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Pelanggan</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1 border border-blue-600 text-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-blue-50">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={() => handleExport()} className="flex items-center gap-1 border border-green-600 text-green-600 px-3 py-2 rounded-lg text-sm hover:bg-green-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openCreate} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari nama / no WA / email..."
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={tag}
          onChange={(e) => { setTag(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm outline-none"
        >
          <option value="">Semua tag</option>
          <option value="reguler">Reguler</option>
          <option value="vip">VIP</option>
          <option value="prospek">Prospek</option>
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h2 className="font-semibold text-lg">{editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h2>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama *" className="w-full border rounded-lg px-3 py-2 text-sm" required />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="No WhatsApp *" className="w-full border rounded-lg px-3 py-2 text-sm" required />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat" className="w-full border rounded-lg px-3 py-2 text-sm" />
            <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Pilih tag</option>
              <option value="reguler">Reguler</option>
              <option value="vip">VIP</option>
              <option value="prospek">Prospek</option>
            </select>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="flex-1 border rounded-lg py-2 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-semibold text-lg">Import Pelanggan dari CSV</h2>
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-blue-600 text-sm hover:underline">
              <FileDown className="w-4 h-4" /> Download template CSV
            </button>
            <p className="text-xs text-gray-500">Format: nama, no_wa, email, alamat, tag, catatan</p>

            <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="block w-full text-sm border rounded-lg p-2" />

            {importing && <div className="flex items-center gap-2 text-blue-600 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Mengimport...</div>}

            {importResult && (
              <div className="space-y-2">
                <p className="text-sm text-green-600">✓ {importResult.success} berhasil</p>
                {importResult.failed > 0 && (
                  <>
                    <p className="text-sm text-red-600">✗ {importResult.failed} gagal</p>
                    <div className="max-h-32 overflow-y-auto text-xs text-red-500 space-y-0.5 bg-red-50 p-2 rounded">
                      {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                  </>
                )}
                <button onClick={() => { setShowImport(false); setImportResult(null); fetch() }} className="w-full border rounded-lg py-2 text-sm">Selesai</button>
              </div>
            )}

            {!importing && !importResult && (
              <button onClick={() => setShowImport(false)} className="w-full border rounded-lg py-2 text-sm">Batal</button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Belum ada pelanggan</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Nama</th>
                    <th className="px-4 py-3 font-medium text-gray-600">No WA</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Tag</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email || '-'}</td>
                      <td className="px-4 py-3">
                        {c.tag && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">{c.tag}</span>}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button onClick={() => openEdit(c)} className="text-blue-500 hover:text-blue-700">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y">
              {customers.map((c) => (
                <div key={c.id} className="px-4 py-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.phone}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {c.tag && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">{c.tag}</span>}
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="text-blue-500 text-xs">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 text-xs">Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>{total} pelanggan</span>
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
