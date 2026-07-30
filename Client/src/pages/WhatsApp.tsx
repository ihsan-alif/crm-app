import { useState } from 'react'
import { MessageSquare } from 'lucide-react'

export default function WhatsApp() {
  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">WhatsApp</h1>
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg">Fitur WhatsApp akan segera hadir</p>
        <p className="text-sm mt-1">Integrasi WhatsApp Cloud API untuk broadcast dan 1-on-1 chat</p>
      </div>
    </div>
  )
}
