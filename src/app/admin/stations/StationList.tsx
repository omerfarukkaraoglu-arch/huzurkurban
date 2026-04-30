'use client'

import { useState } from 'react'
import { createStation, deleteStation } from '@/app/actions/stations'

const PREDEFINED_STATUSES = [
    { id: 'KESILDI', label: 'Kesildi' },
    { id: 'PARCALAMADA', label: 'Parçalanıyor' },
    { id: 'TARTIDA', label: 'Tartılıyor' },
    { id: 'DAGITIMDA', label: 'Dağıtımda' },
    { id: 'TESLIM_EDILDI', label: 'Teslim Edildi' },
]

export default function StationList({ initialStations }: { initialStations: any[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const res = await createStation(formData)
    if (res.success) {
      setIsAdding(false)
      e.currentTarget.reset()
    } else {
      setError(res.error || 'Hata oluştu')
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu istasyonu silmek istediğinize emin misiniz?')) return
    const res = await deleteStation(id)
    if (!res.success) alert(res.error)
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-lg flex items-center justify-center text-lg">➕</span>
            Yeni İstasyon Ekle
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">İstasyon Adı</label>
            <input name="name" required placeholder="Örn: Parçalama" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Güncellenecek Durum</label>
            <select name="status" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none">
                {PREDEFINED_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sıralama</label>
            <input name="order" type="number" defaultValue="0" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="flex items-end">
            <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50">
              {loading ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </form>
        {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Sıra</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">İstasyon Adı</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Ayarlandığı Durum</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialStations.map((st) => (
              <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-slate-400">#{st.order}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{st.name}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                    {PREDEFINED_STATUSES.find(s => s.id === st.status)?.label || st.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(st.id)} className="text-red-400 hover:text-red-600 font-bold transition-colors">Sil</button>
                </td>
              </tr>
            ))}
            {initialStations.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Henüz istasyon eklenmedi.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
