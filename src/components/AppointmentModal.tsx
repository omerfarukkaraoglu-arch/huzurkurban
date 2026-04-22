'use client'

import { useActionState, useEffect } from 'react'
import { bookAppointment } from '@/app/actions/appointments'

const initialState = { success: false, message: '', error: '' }

export default function AppointmentModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(bookAppointment, initialState)

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state.success, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-600 text-white">
          <h3 className="text-xl font-bold">Randevu Al</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors text-2xl leading-none">×</button>
        </div>

        {state.success ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">Talebiniz Alındı</h4>
            <p className="text-slate-600">{state.message}</p>
          </div>
        ) : (
          <form action={formAction} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
              <input type="text" name="fullName" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Adınız Soyadınız" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input type="tel" name="phone" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="05XX XXX XX XX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gün</label>
                <input type="date" name="date" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Saat Dilimi</label>
                <select name="timeSlot" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">Seçiniz</option>
                  <option value="09:00 - 11:00">09:00 - 11:00</option>
                  <option value="11:00 - 13:00">11:00 - 13:00</option>
                  <option value="13:00 - 15:00">13:00 - 15:00</option>
                  <option value="15:00 - 17:00">15:00 - 17:00</option>
                  <option value="17:00 - 19:00">17:00 - 19:00</option>
                </select>
              </div>
            </div>

            {state.error && <p className="text-red-500 text-sm font-medium">{state.error}</p>}

            <button type="submit" disabled={isPending} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-70">
              {isPending ? 'Gönderiliyor...' : 'Randevu Oluştur'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
