'use client'

import { useActionState, useTransition, useState } from 'react'
import { createFAQ, updateFAQ, deleteFAQ, updateFAQOrder } from '@/app/actions/faq'

const initialState: { success?: boolean; message?: string; error?: string } = {}

export default function FAQManager({ initialFAQs }: { initialFAQs: any[] }) {
  const [state, formAction, isPending] = useActionState(
    (prevState: any, formData: FormData) => createFAQ(prevState, formData), 
    initialState
  )
  const [editState, editFormAction, isEditPending] = useActionState(
    (prevState: any, formData: FormData) => updateFAQ(prevState, formData), 
    initialState
  )
  const [isWorking, startTransition] = useTransition()
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<any | null>(null)

  // Clear modal on success
  if (state?.success && isAdding) {
    setIsAdding(false)
  }
  if (editState?.success && editingFAQ) {
    setEditingFAQ(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
      startTransition(async () => {
        await deleteFAQ(id)
      })
    }
  }

  const handleMove = (id: string, currentOrder: number, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1
    startTransition(async () => {
      await updateFAQOrder(id, newOrder)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2"
        >
          <span>+</span> Yeni Soru Ekle
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border-2 border-emerald-100 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">Yeni Soru Ekle</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Soru</label>
              <input type="text" name="question" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Örn: Kesim nerede yapılıyor?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cevap</label>
              <textarea name="answer" required rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Cevap metni..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sıralama (Opsiyonel)</label>
              <input type="number" name="order" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" defaultValue={initialFAQs.length} />
            </div>
            {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Vazgeç</button>
              <button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">
                {isPending ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {initialFAQs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 italic">
              Henüz soru eklenmemiş.
            </div>
          ) : (
            initialFAQs.map((faq: any, index: number) => (
              <div key={faq.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">{faq.question}</h4>
                    <p className="text-slate-600 text-sm">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1 mr-2">
                        <button 
                            disabled={index === 0 || isWorking}
                            onClick={() => handleMove(faq.id, faq.order, 'up')}
                            className="p-1 text-slate-400 hover:text-emerald-600 disabled:opacity-20 translate-y-1"
                        >▲</button>
                        <button 
                            disabled={index === initialFAQs.length - 1 || isWorking}
                            onClick={() => handleMove(faq.id, faq.order, 'down')}
                            className="p-1 text-slate-400 hover:text-emerald-600 disabled:opacity-20 -translate-y-1"
                        >▼</button>
                    </div>
                    <button 
                      onClick={() => setEditingFAQ(faq)}
                      className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100"
                    >Düzenle</button>
                    <button 
                      onClick={() => handleDelete(faq.id)}
                      disabled={isWorking}
                      className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-100 disabled:opacity-50"
                    >Sil</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingFAQ && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Soruyu Düzenle</h3>
              <button onClick={() => setEditingFAQ(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form action={editFormAction} className="p-6 space-y-4">
              <input type="hidden" name="id" value={editingFAQ.id} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Soru</label>
                <input type="text" name="question" defaultValue={editingFAQ.question} required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cevap</label>
                <textarea name="answer" defaultValue={editingFAQ.answer} required rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sıralama</label>
                <input type="number" name="order" defaultValue={editingFAQ.order} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              {editState?.error && <p className="text-red-500 text-sm">{editState.error}</p>}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingFAQ(null)} className="px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Vazgeç</button>
                <button type="submit" disabled={isEditPending} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">
                  {isEditPending ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
