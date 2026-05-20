'use client'

import { useState, useTransition } from 'react'
import { updateAnimalStatus, bulkUpdateAnimalStatus } from '@/app/actions/animals'

const PREDEFINED_STATUS_LABELS: Record<string, string> = {
  BEKLEMEDE: 'Beklemede',
  KESILDI: 'Kesildi',
  PARCALAMADA: 'Parçalanıyor',
  TARTIDA: 'Tartılıyor',
  DAGITIMDA: 'Dağıtımda',
  TESLIM_EDILDI: 'Teslim Edildi'
}

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  BEKLEMEDE: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  KESILDI: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PARCALAMADA: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  TARTIDA: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  DAGITIMDA: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  TESLIM_EDILDI: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
}

export default function TrackingManager({ 
  initialAnimals, 
  stations 
}: { 
  initialAnimals: any[], 
  stations: any[] 
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [isWorking, startTransition] = useTransition()

  // Get dynamic list of available statuses in order of flow
  const statusFlow = [
    { id: 'BEKLEMEDE', label: 'Beklemede' },
    ...stations.map(st => ({
      id: st.status,
      label: st.name
    }))
  ].filter((v, i, self) => self.findIndex(t => t.id === v.id) === i) // deduplicate

  // Helper to count animals by status
  const getStatusCount = (status: string) => {
    if (status === 'ALL') return initialAnimals.length
    return initialAnimals.filter(a => (a.deliveryStatus || 'BEKLEMEDE') === status).length
  }

  // Filtered animals
  const filteredAnimals = initialAnimals.filter(animal => {
    const status = animal.deliveryStatus || 'BEKLEMEDE'
    const matchesTab = activeTab === 'ALL' || status === activeTab

    const term = searchTerm.toLocaleLowerCase('tr-TR')
    const hasMatchingShareholder = animal.shareholders?.some((s: any) => 
      s.registration?.fullName.toLocaleLowerCase('tr-TR').includes(term) ||
      s.registration?.phone.includes(term)
    )

    const matchesSearch = 
      !searchTerm ||
      (animal.earTag && animal.earTag.toLocaleLowerCase('tr-TR').includes(term)) ||
      (animal.groupName && animal.groupName.toLocaleLowerCase('tr-TR').includes(term)) ||
      hasMatchingShareholder

    return matchesTab && matchesSearch
  })

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAnimals.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredAnimals.map(a => a.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      await updateAnimalStatus(id, newStatus)
    })
  }

  const handleBulkStatusChange = (newStatus: string) => {
    if (selectedIds.length === 0) return
    startTransition(async () => {
      const res = await bulkUpdateAnimalStatus(selectedIds, newStatus)
      if (res.success) {
        setSelectedIds([])
      } else {
        alert(res.error || 'Güncelleme sırasında hata oluştu.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'ALL' 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' 
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'ALL' ? 'text-emerald-100' : 'text-slate-400'}`}>Tümü</div>
          <div className="text-2xl font-black mt-1">{getStatusCount('ALL')}</div>
        </button>

        {statusFlow.map(stage => {
          const isActive = activeTab === stage.id
          const count = getStatusCount(stage.id)
          const colors = STATUS_COLORS[stage.id] || STATUS_COLORS.BEKLEMEDE

          return (
            <button
              key={stage.id}
              onClick={() => setActiveTab(stage.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isActive 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : colors.bg.replace('bg-', 'bg-') || 'bg-slate-400'}`}></span>
                <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  {stage.label}
                </span>
              </div>
              <div className="text-2xl font-black mt-1">{count}</div>
            </button>
          )
        })}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Küpe No, grup veya hissedar ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 bg-white placeholder:text-slate-400"
            />
            <div className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</div>
          </div>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Temizle
            </button>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 px-2">
              {selectedIds.length} Seçili
            </span>
            <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block"></div>
            <div className="flex flex-wrap items-center gap-1">
              {statusFlow.map(stage => {
                const colors = STATUS_COLORS[stage.id] || STATUS_COLORS.BEKLEMEDE
                return (
                  <button
                    key={stage.id}
                    onClick={() => handleBulkStatusChange(stage.id)}
                    disabled={isWorking}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all hover:opacity-85 ${colors.bg} ${colors.text} ${colors.border}`}
                  >
                    {stage.label} İstasyonuna Taşı
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer bg-white"
                    checked={selectedIds.length === filteredAnimals.length && filteredAnimals.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 font-bold">No / Küpe Numarası</th>
                <th className="p-4 font-bold">Grup Adı</th>
                <th className="p-4 font-bold">Kilo (Ağırlık)</th>
                <th className="p-4 font-bold">Mevcut Hissedarlar</th>
                <th className="p-4 font-bold">Bulunduğu İstasyon / Aşama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-bold italic">
                    Aranan kritere veya filtreye uygun kurbanlık bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal, idx) => {
                  const status = animal.deliveryStatus || 'BEKLEMEDE'
                  const colors = STATUS_COLORS[status] || STATUS_COLORS.BEKLEMEDE
                  const currentLabel = PREDEFINED_STATUS_LABELS[status] || status

                  return (
                    <tr 
                      key={animal.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        selectedIds.includes(animal.id) ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer bg-white"
                          checked={selectedIds.includes(animal.id)}
                          onChange={() => toggleSelect(animal.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-slate-900 text-base">{animal.earTag}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        {animal.groupName || (
                          <span className="text-slate-400 italic text-xs">Atanmamış</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {animal.weight ? `${animal.weight} KG` : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 max-w-[250px]">
                          <span className="font-bold text-emerald-600 text-xs">{animal.shareholders?.length || 0}/7 Hissedar</span>
                          {animal.shareholders?.length > 0 && (
                            <div className="text-xs text-slate-500 font-medium truncate" title={animal.shareholders.map((s: any) => s.registration?.fullName).join(', ')}>
                              {animal.shareholders.map((s: any) => s.registration?.fullName).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={status}
                          disabled={isWorking}
                          onChange={(e) => handleStatusChange(animal.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl outline-none border transition-all ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {statusFlow.map(stage => (
                            <option key={stage.id} value={stage.id}>
                              {stage.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
