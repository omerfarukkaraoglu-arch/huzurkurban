'use client'

import { useActionState, useTransition } from 'react'
import { createGroup, deleteGroup, toggleGroupStatus } from '@/app/actions/settings'

const initialState = { success: false, message: '', error: '' }

export default function GroupManager({ initialGroups }: { initialGroups: any[] }) {
  const [state, formAction, isPending] = useActionState(createGroup, initialState)
  const [isWorking, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (confirm('Bu grubu silmek istediğinize emin misiniz?')) {
      startTransition(async () => {
        await deleteGroup(id)
      })
    }
  }

  const handleToggle = (id: string) => {
    startTransition(async () => {
      await toggleGroupStatus(id)
    })
  }

  return (
    <div className="space-y-6">
      {/* Liste */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Mevcut Kurban Grupları</h3>
        </div>
        <div className="p-0">
          {initialGroups.length === 0 ? (
            <div className="p-6 text-slate-500 text-center">Henüz eklenmiş bir grup bulunmuyor.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {initialGroups.map(group => (
                <li key={group.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{group.name}</span>
                      {group.isDonation && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Bağış</span>}
                      {!group.isActive && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">DOLDU</span>}
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      {group.price} TL
                      {group.maxSlots && <span className="ml-2 text-slate-400">• Kontenjan: {group.maxSlots} kişi</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggle(group.id)}
                      disabled={isWorking}
                      className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
                        group.isActive 
                          ? 'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100' 
                          : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {group.isActive ? '⏸ Kayıt Durdur' : '▶ Kayıt Aç'}
                    </button>
                    <button 
                      onClick={() => handleDelete(group.id)}
                      disabled={isWorking}
                      className="text-red-500 hover:text-red-700 font-medium text-sm px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Sil
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Yeni Ekle Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Yeni Grup Ekle</h3>
        </div>
        <form action={formAction} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grup Adı *</label>
              <input type="text" name="name" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Örn: Büyükbaş 1. Grup" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fiyat (TL) *</label>
              <input type="text" name="price" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Örn: 28.000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kontenjan <span className="text-slate-400 font-normal">(Opsiyonel)</span></label>
              <input type="number" name="maxSlots" min="1" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Örn: 50 (boş = sınırsız)" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <input type="checkbox" id="isDonation" name="isDonation" className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500" />
            <label htmlFor="isDonation" className="text-sm font-medium text-slate-700">Bu bir "Bağış Hisse" grubudur</label>
          </div>

          {state?.error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{state.error}</div>}
          {state?.success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">{state.message}</div>}

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isPending} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70">
              {isPending ? 'Ekleniyor...' : 'Grubu Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
