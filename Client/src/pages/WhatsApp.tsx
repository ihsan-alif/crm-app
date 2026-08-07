import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Customer, WABroadcast, WAConfig, WAMessage, PaginatedResponse, ApiResponse } from '../types'
import { MessageSquare, Send, Megaphone, Settings, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

type Tab = 'inbox' | 'broadcast' | 'settings'

export default function WhatsApp() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('inbox')

  const tabs = [
    { id: 'inbox' as Tab, label: 'Inbox', icon: MessageSquare },
    { id: 'broadcast' as Tab, label: 'Broadcast', icon: Megaphone },
    { id: 'settings' as Tab, label: 'Pengaturan', icon: Settings },
  ].filter((t) => t.id !== 'settings' || user?.role === 'admin')

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">WhatsApp</h1>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm transition-colors ${
              tab === t.id ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'inbox' && <InboxTab />}
      {tab === 'broadcast' && <BroadcastTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}

function InboxTab() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [messages, setMessages] = useState<WAMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async (id: string) => {
    if (!id) return
    setLoading(true)
    try {
      const res = await api.get<ApiResponse<WAMessage[]>>(`/wa/messages?customer_id=${id}`)
      setMessages((res.data.data || []).slice().reverse())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.get<PaginatedResponse<Customer>>('/customers?per_page=100')
      .then((res) => setCustomers(res.data.data))
  }, [])

  useEffect(() => {
    setMessages([])
    if (customerId) fetchMessages(customerId)
  }, [customerId])

  useEffect(() => {
    if (!customerId) return
    const t = setInterval(() => fetchMessages(customerId), 10000)
    return () => clearInterval(t)
  }, [customerId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId || !draft.trim()) return
    setSending(true)
    try {
      await api.post('/wa/send', { customer_id: customerId, message: draft })
      setDraft('')
      await fetchMessages(customerId)
    } catch {}
    setSending(false)
  }

  const fmtTime = (s: string) =>
    new Date(s).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col max-w-2xl" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="p-4 border-b">
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
        >
          <option value="">Pilih pelanggan</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
          ))}
        </select>
      </div>

      {!customerId ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-12 px-4 text-center">
          Pilih pelanggan di atas untuk melihat riwayat percakapan
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
            {loading && messages.length === 0 && (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
            )}
            {!loading && messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">Belum ada pesan. Mulai percakapan di bawah.</div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    m.direction === 'inbound'
                      ? 'bg-white border text-gray-800'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p className={`text-[10px] mt-1 ${m.direction === 'inbound' ? 'text-gray-400' : 'text-green-100'}`}>
                    {fmtTime(m.sent_at || m.created_at)}
                    {m.direction === 'outbound' && (
                      <span className="ml-1">
                        {m.status === 'failed' ? 'â€¢ gagal' : m.status === 'sent' ? 'âœ“âœ“' : 'âœ“'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleReply} className="border-t p-3 flex gap-2 bg-white">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ketik balasan... Gunakan {nama} untuk nama pelanggan"
              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="flex items-center justify-center bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </>
      )}
    </div>
  )
}


function BroadcastTab() {
  const [broadcasts, setBroadcasts] = useState<WABroadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [tag, setTag] = useState('')
  const [all, setAll] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetch = () => {
    setLoading(true)
    api.get<ApiResponse<WABroadcast[]>>('/wa/broadcasts')
      .then((res) => setBroadcasts(res.data.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/wa/broadcasts', {
        title,
        message,
        tag: all ? null : tag || null,
        all,
      })
      setShowForm(false)
      setTitle('')
      setMessage('')
      setTag('')
      setAll(true)
      fetch()
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async (id: string) => {
    if (!confirm('Kirim broadcast ini sekarang?')) return
    try {
      await api.post(`/wa/broadcasts/${id}/send`)
      fetch()
    } catch {}
  }

  const statusIcon = (s: string) => {
    switch (s) {
      case 'draft': return <Clock className="w-4 h-4 text-gray-400" />
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Riwayat Broadcast</h2>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Broadcast Baru
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h2 className="font-semibold text-lg">Broadcast Baru</h2>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul (internal)" className="w-full border rounded-lg px-3 py-2 text-sm" required />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Pesan... Gunakan {nama}" className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} required />

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} id="all" />
              <label htmlFor="all" className="text-sm">Kirim ke semua pelanggan</label>
            </div>

            {!all && (
              <select value={tag} onChange={(e) => setTag(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Pilih tag</option>
                <option value="reguler">Reguler</option>
                <option value="vip">VIP</option>
                <option value="prospek">Prospek</option>
              </select>
            )}

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
      ) : broadcasts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">
          <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Belum ada broadcast</p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {statusIcon(b.status)}
                    <p className="font-medium text-sm">{b.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{b.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {b.target_all ? 'Semua pelanggan' : `Tag: ${b.target_tag}`}
                    {b.total > 0 && ` â€¢ ${b.sent} terkirim / ${b.failed} gagal`}
                  </p>
                </div>
                {b.status === 'draft' && (
                  <button
                    onClick={() => handleSend(b.id)}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                  >
                    Kirim
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingsTab() {
  const [config, setConfig] = useState<WAConfig>({ phone_number_id: '', token: '', is_active: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get<ApiResponse<WAConfig>>('/wa/config')
      .then((res) => setConfig(res.data.data || { phone_number_id: '', token: '', is_active: false }))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await api.put('/wa/config', config)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <h2 className="font-semibold">Konfigurasi WhatsApp API</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          <p className="font-medium mb-1">Cara mendapatkan:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs">
            <li>Buka <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">Meta for Developers</a></li>
            <li>Buat App &rarr; WhatsApp &rarr; dapatkan <strong>Phone Number ID</strong></li>
            <li>Generate <strong>Token</strong> (Permanent Token disarankan)</li>
            <li>Masukkan di sini dan aktifkan</li>
          </ol>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number ID</label>
          <input
            value={config.phone_number_id}
            onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none font-mono"
            placeholder="123456789"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Token Akses</label>
          <textarea
            value={config.token}
            onChange={(e) => setConfig({ ...config, token: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none font-mono"
            rows={2}
            placeholder="EAATx..."
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.is_active}
            onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
            id="is_active"
          />
          <label htmlFor="is_active" className="text-sm">Aktifkan WhatsApp</label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
        >
          {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
        </button>

        {saved && <p className="text-sm text-center text-green-600">Konfigurasi berhasil disimpan</p>}
      </form>
    </div>
  )
}
