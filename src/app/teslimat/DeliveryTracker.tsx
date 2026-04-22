'use client'

import { useState, useTransition } from 'react'
import { getDeliveryStatusByPhone } from '@/app/actions/delivery'

const STAGES = [
  { id: 'BEKLEMEDE', label: 'Beklemede', icon: '⏳' },
  { id: 'SIRADA', label: 'Kesim Sırasında', icon: '🐄' },
  { id: 'KESILDI', label: 'Kesildi / Paylanıyor', icon: '⚖️' },
  { id: 'YUKLENDI', label: 'Araca Yüklendi', icon: '📦' },
  { id: 'TESLIMAT_ADRESINDE', label: 'Teslimat Adresinde', icon: '🚚' },
  { id: 'TESLIM_EDILDI', label: 'Teslim Edildi', icon: '✅' },
]

export default function DeliveryTracker() {
  const [phone, setPhone] = useState('')
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResults(null)
    
    if (!phone) {
      setError('Lütfen bir telefon numarası girin.')
      return
    }

    startTransition(async () => {
      const res = await getDeliveryStatusByPhone(phone)
      if (res.success) {
        setResults(res.data)
      } else {
        setError(res.error || 'Sorgulama başarısız oldu.')
      }
    })
  }

  const getStageIndex = (status: string) => {
    const idx = STAGES.findIndex(s => s.id === status)
    return idx === -1 ? 0 : idx
  }

  return (
    <div className="space-y-8">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="tel"
            placeholder="05XX XXX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-lg"
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {isPending ? 'Sorgulanıyor...' : 'Sorgula'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
      </form>

      {/* Results */}
      {results && results.length > 0 && (
        <div className="space-y-6">
          {results.map((item: any) => {
             const currentStageIdx = getStageIndex(item.deliveryStatus || 'BEKLEMEDE')
             
             return (
              <div key={item.registrationId + '-' + (item.animalId || 'no-animal')} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {item.earTag ? `Hayvan: ${item.earTag}` : item.group}
                    </h3>
                    <p className="text-slate-500 mt-1">Hissedar: <span className="font-medium text-slate-700">{item.fullName}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold font-mono border border-slate-200">
                      Takip No: #{item.registrationId.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="relative">
                  {/* Background Line */}
                  <div className="absolute top-6 left-0 w-full h-1 bg-slate-100 -z-10"></div>
                  {/* Active Line */}
                  <div 
                    className="absolute top-6 left-0 h-1 bg-emerald-500 transition-all duration-1000 -z-10" 
                    style={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
                  ></div>

                  <div className="flex justify-between relative z-0">
                    {STAGES.map((stage: any, sIdx: number) => {
                      const isCompleted = sIdx <= currentStageIdx
                      const isCurrent = sIdx === currentStageIdx

                      return (
                        <div key={stage.id} className="flex flex-col items-center group w-1/6">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'
                          } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}>
                            {stage.icon}
                          </div>
                          <span className={`text-xs font-bold mt-3 text-center sm:block ${isCurrent ? 'text-emerald-600' : isCompleted ? 'text-slate-700' : 'text-slate-400 hidden group-hover:block'}`}>
                            {stage.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Cancel or hold messages */}
                {item.status === 'İPTAL' && (
                  <div className="mt-8 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium">
                    Bu kayıt iptal edilmiştir.
                  </div>
                )}
              </div>
             )
          })}
        </div>
      )}
    </div>
  )
}
