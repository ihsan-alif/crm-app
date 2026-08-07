import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import type { Transaction, ApiResponse } from '../types'
import { Loader2, Printer, ArrowLeft } from 'lucide-react'

export default function TransactionPrint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tx, setTx] = useState<Transaction & { customer?: { name: string; phone: string }; tenant?: { name: string; logo_url?: string } } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ApiResponse<any>>(`/transactions/${id}`)
      .then((res) => setTx(res.data.data))
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = () => window.print()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Transaksi tidak ditemukan</p>
        <button onClick={() => navigate('/transactions')} className="text-blue-600 underline text-sm">Kembali</button>
      </div>
    )
  }

  return (
    <>
      <div className="no-print p-4 bg-white border-b flex items-center justify-between">
        <button onClick={() => navigate('/transactions')} className="flex items-center gap-1 text-gray-600 text-sm">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <button onClick={handlePrint} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Printer className="w-4 h-4" /> Cetak Nota
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white p-6 sm:p-8">
        <div id="receipt" className="text-sm leading-relaxed">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              {tx.tenant?.logo_url && (
                <img src={tx.tenant.logo_url} alt="Logo" className="h-16 w-16 object-contain" />
              )}
              <div>
                <p className="font-bold text-2xl uppercase">{tx.tenant?.name || 'TOKO'}</p>
                <p className="text-gray-500 mt-1">Terima kasih atas kunjungan Anda</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl uppercase">Nota Penjualan</p>
              <p className="text-gray-500 mt-1 font-mono">{tx.number}</p>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1">Dibuat pada</p>
              <p>{new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1">Status</p>
              <span className={`inline-block px-3 py-0.5 rounded text-xs font-semibold ${tx.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {tx.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
              </span>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1">Pelanggan</p>
              <p className="font-semibold">{tx.customer?.name || '-'}</p>
            </div>
            {tx.customer?.phone && (
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">No. HP</p>
                <p>{tx.customer.phone}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-gray-100 border border-gray-300">
                <th className="text-left px-3 py-2 font-semibold w-10">#</th>
                <th className="text-left px-3 py-2 font-semibold">Item</th>
                <th className="text-right px-3 py-2 font-semibold w-20">Qty</th>
                <th className="text-right px-3 py-2 font-semibold w-32">Harga</th>
                <th className="text-right px-3 py-2 font-semibold w-32">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {tx.items?.map((item, i) => (
                <tr key={i} className="border border-gray-300">
                  <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2 text-right">{item.qty}</td>
                  <td className="px-3 py-2 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2 text-right">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end mb-6">
            <div className="w-72">
              <div className="flex justify-between py-2 border-b border-gray-300 font-bold text-lg">
                <span>Total</span>
                <span>Rp {tx.total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {tx.notes && (
            <div className="border border-gray-300 rounded p-4 mb-6">
              <p className="text-gray-500 text-xs uppercase mb-1">Catatan</p>
              <p>{tx.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-end pt-8">
            <div className="text-gray-400 text-sm">
              <p>Terima kasih telah berbelanja di {tx.tenant?.name || 'toko kami'}.</p>
              <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs mb-8">Penerima / Pembeli</p>
              <div className="w-40 border-t border-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
