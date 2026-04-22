'use client'

import { useState, useTransition } from 'react'
import { updateAnimalDeliveryStatus, bulkUpdateAnimalDeliveryStatus } from '@/app/actions/delivery'

const DELIVERY_STAGES = [
  { id: 'BEKLEMEDE', label: 'Beklemede', color: 'bg-slate-100 text-slate-700' },
  { id: 'SIRADA', label: 'Kesim Sırasında', color: 'bg-amber-100 text-amber-700' },
  { id: 'KESILDI', label: 'Kesildi / Paylanıyor', color: 'bg-orange-100 text-orange-700' },
  { id: 'YUKLENDI', label: 'Araca Yüklendi', color: 'bg-blue-100 text-blue-700' },
  { id: 'TESLIMAT_ADRESINDE', label: 'Teslimat Adresinde', color: 'bg-purple-100 text-purple-700' },
  { id: 'TESLIM_EDILDI', label: 'Teslim Edildi', color: 'bg-emerald-100 text-emerald-700' },
]

export default function DeliveryManager({ initialAnimals }: { initialAnimals: any[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isWorking, startTransition] = useTransition()

  const filteredAnimals = initialAnimals.filter(animal => {
    // Arama: Küpe No, Grup Adı veya Hissedar Adı
    const term = searchTerm.toLocaleLowerCase('tr-TR')
    
    // Check if any shareholder matches the search term
    const hasMatchingShareholder = animal.shareholders?.some((s: any) => 
      s.registration?.fullName.toLocaleLowerCase('tr-TR').includes(term) ||
      s.registration?.phone.includes(term)
    )

    const matchesSearch = 
      (animal.earTag && animal.earTag.toLocaleLowerCase('tr-TR').includes(term)) ||
      (animal.groupName && animal.groupName.toLocaleLowerCase('tr-TR').includes(term)) ||
      hasMatchingShareholder
      
    const matchesStatus = statusFilter === 'ALL' || animal.deliveryStatus === statusFilter
    
    return matchesSearch && matchesStatus
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

  const handleBulkStatusChange = (newStatus: string) => {
    if (selectedIds.length === 0) return
    startTransition(async () => {
      const res = await bulkUpdateAnimalDeliveryStatus(selectedIds, newStatus)
      if (res.success) {
        setSelectedIds([])
      } else {
        alert(res.error)
      }
    })
  }

  const handleSingleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      await updateAnimalDeliveryStatus(id, newStatus)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Küpe No, Grup veya Hissedar ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <div className="absolute left-3 top-2.5 text-slate-400">🔍</div>
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700"
          >
            <option value="ALL">Tüm Durumlar</option>
            {DELIVERY_STAGES.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.label}</option>
            ))}
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-sm font-bold text-slate-700 px-3">
              {selectedIds.length} Seçili
            </span>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-1">
               {DELIVERY_STAGES.map(stage => (
                 <button
                   key={stage.id}
                   onClick={() => handleBulkStatusChange(stage.id)}
                   disabled={isWorking}
                   className={`px-2 py-1.5 text-xs font-semibold rounded transition-colors ${stage.color} hover:opacity-80`}
                 >
                   {stage.label}
                 </button>
               ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={selectedIds.length === filteredAnimals.length && filteredAnimals.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 font-semibold">Küpe No / Grup</th>
                <th className="p-4 font-semibold">Kilo</th>
                <th className="p-4 font-semibold">Hissedarlar ({initialAnimals.reduce((acc, curr) => acc + Math.max(0, curr.shareholders?.length || 0), 0) > 0 ? 'Kişiler' : 'Adet'})</th>
                <th className="p-4 font-semibold">Teslimat Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Hayvan kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal) => (
                  <tr key={animal.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(animal.id) ? 'bg-emerald-50/30' : ''}`}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={selectedIds.includes(animal.id)}
                        onChange={() => toggleSelect(animal.id)}
                      />
                    </td>
                    <td className="p-4 text-slate-600">
                       <div className="font-bold text-slate-900 text-base mb-1">{animal.earTag}</div>
                       <div className="text-xs text-slate-500">{animal.groupName || '-'}</div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{animal.weight ? `${animal.weight} kg` : '-'}</td>
                    <td className="p-4 text-slate-600">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-emerald-600">{animal.shareholders?.length || 0} Hissedar</span>
                        {animal.shareholders?.length > 0 && (
                           <div className="text-xs text-slate-400">
                             {animal.shareholders.slice(0, 2).map((s: any) => s.registration?.fullName).join(', ')}
                             {animal.shareholders.length > 2 && ' ...'}
                           </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={animal.deliveryStatus || 'BEKLEMEDE'}
                        onChange={(e) => handleSingleStatusChange(animal.id, e.target.value)}
                        disabled={isWorking}
                        className={`text-xs font-bold px-2 py-1.5 rounded outline-none border-0 ring-1 ring-inset ${
                          DELIVERY_STAGES.find(s => s.id === (animal.deliveryStatus || 'BEKLEMEDE'))?.color.replace('bg-', 'ring-').replace('100', '200')
                        } ${DELIVERY_STAGES.find(s => s.id === (animal.deliveryStatus || 'BEKLEMEDE'))?.color}`}
                      >
                         {DELIVERY_STAGES.map(stage => (
                           <option key={stage.id} value={stage.id}>{stage.label}</option>
                         ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
