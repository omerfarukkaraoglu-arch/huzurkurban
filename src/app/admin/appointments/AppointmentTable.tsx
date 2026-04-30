'use client'

import { updateAppointmentStatus, deleteAppointment } from '@/app/actions/appointments'
import { useState } from 'react'

export default function AppointmentTable({ appointments }: { appointments: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpdate = async (id: string, status: string) => {
    setLoading(id)
    const res = await updateAppointmentStatus(id, status)
    if (!res.success) alert(res.error)
    setLoading(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu randevu talebini silmek istediğinize emin misiniz?')) return
    setLoading(id)
    const res = await deleteAppointment(id)
    if (!res.success) alert(res.error)
    setLoading(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-900">
              <th className="p-4 font-bold">Tarih</th>
              <th className="p-4 font-bold">Saat</th>
              <th className="p-4 font-bold">Ad Soyad</th>
              <th className="p-4 font-bold">Telefon</th>
              <th className="p-4 font-bold">Durum</th>
              <th className="p-4 font-bold text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-700 font-medium">Henüz randevu talebi bulunmuyor.</td>
              </tr>
            ) : (
              appointments.map((app: any) => (
                <tr key={app.id} className={`hover:bg-slate-50 transition-colors ${loading === app.id ? 'opacity-50 pointer-events-none' : ''}`}>
                  <td className="p-4 font-bold text-slate-800">{new Date(app.date).toLocaleDateString('tr-TR')}</td>
                  <td className="p-4 text-blue-700 font-black">{app.timeSlot}</td>
                  <td className="p-4 text-slate-900 font-black">{app.fullName}</td>
                  <td className="p-4 text-slate-700 font-bold">{app.phone}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase transition-all ${
                      app.status === 'BEKLEMEDE' 
                        ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' 
                        : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {app.status === 'BEKLEMEDE' && (
                        <button 
                          onClick={() => handleUpdate(app.id, 'ONAYLANDI')}
                          className="px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-xs transition-all border border-emerald-100"
                        >
                          Onayla
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(app.id)}
                        className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg font-bold text-xs transition-all border border-rose-100"
                      >
                        İptal / Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
