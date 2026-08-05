import { useState } from 'react'
import { Download, FileDown } from 'lucide-react'
import { downloadFile } from '../lib/api'

interface ExportButtonProps {
  url: string
  baseName: string
  label?: string
  format?: 'csv' | 'xlsx'
}

export default function ExportButton({ url, baseName, label = 'Export', format }: ExportButtonProps) {
  const [open, setOpen] = useState(false)

  const doExport = (f: 'csv' | 'xlsx') => {
    downloadFile(`${url}?format=${f}`, `${baseName}.${f}`)
    setOpen(false)
  }

  if (format) {
    return (
      <button onClick={() => doExport(format)} className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
        <FileDown className="w-4 h-4" /> {label}
      </button>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 border border-green-600 text-green-600 px-3 py-2 rounded-lg text-sm hover:bg-green-50">
        <Download className="w-4 h-4" /> {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-40 bg-white border rounded-lg shadow-lg overflow-hidden">
            <button onClick={() => doExport('csv')} className="w-full text-left px-3 py-2 text-sm hover:bg-green-50">
              CSV
            </button>
            <button onClick={() => doExport('xlsx')} className="w-full text-left px-3 py-2 text-sm hover:bg-green-50">
              Excel (.xlsx)
            </button>
          </div>
        </>
      )}
    </div>
  )
}