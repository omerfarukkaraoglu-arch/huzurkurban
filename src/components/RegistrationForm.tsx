'use client'

import { useState, useActionState, useEffect } from 'react'
import { submitRegistration } from '@/app/actions/register'
import { CheckCircle2, HeartHandshake } from 'lucide-react'

const initialState = {
  success: false,
  message: '',
  error: ''
}

export default function RegistrationForm({ settings, groups = [] }: { settings: any, groups?: any[] }) {
  const [state, formAction, isPending] = useActionState(submitRegistration, initialState)
  const [mode, setMode] = useState<'hisse' | 'bagis'>('hisse')

  useEffect(() => {
    const handleModeChange = (e: any) => {
      if (e.detail === 'hisse' || e.detail === 'bagis') {
        setMode(e.detail)
      }
    }
    window.addEventListener('change-form-mode', handleModeChange)
    return () => window.removeEventListener('change-form-mode', handleModeChange)
  }, [])
  
  const standardGroups = groups.filter(g => !g.isDonation && g.isActive)
  const donationGroups = groups.filter(g => g.isDonation && g.isActive)

  if (state?.success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          ✓
        </div>
        <h3 className="text-2xl font-bold text-emerald-800 mb-2">Başvurunuz Alındı</h3>
        <p className="text-emerald-700">{state.message}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 relative mb-20 z-10 -mt-10">
      <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
        <button 
          onClick={() => setMode('hisse')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'hisse' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <CheckCircle2 className="w-4 h-4" /> Hisse Kaydı
        </button>
        <button 
          onClick={() => setMode('bagis')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'bagis' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <HeartHandshake className="w-4 h-4" /> Bağış Hisse
        </button>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          {mode === 'hisse' ? 'Kurban Kayıt Formu' : 'Bağış Hisse Formu'}
        </h2>
        <p className="text-slate-500">
          {mode === 'hisse' 
            ? 'Hissenizi ayırtmak için lütfen aşağıdaki bilgileri eksiksiz doldurun.' 
            : 'Bağış hisse kaydı için lütfen bilgilerinizi doldurun.'}
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="isDonation" value={mode === 'bagis' ? 'true' : 'false'} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad *</label>
            <input type="text" name="fullName" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Örn: Ahmet Yılmaz" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon *</label>
            <input type="tel" name="phone" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="0555 000 00 00" />
          </div>
        </div>

        {mode === 'hisse' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adres *</label>
            <textarea name="address" rows={2} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none" placeholder="Tam teslimat adresinizi girin"></textarea>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mode === 'hisse' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kurban Grubu *
              </label>
              <select id="group-select" name="group" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
                <option value="">Seçiniz...</option>
                {standardGroups.map(group => (
                  <option key={group.id} value={`${group.name} (${group.price} TL)`}>
                    {group.name} ({group.price} TL)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <input type="hidden" name="address" value="Bağış Kaydı" />
              <input type="hidden" name="group" value="Huzur Kurban Bağışı" />
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {mode === 'hisse' ? 'Hisse/Not Belirtin (İsteğe bağlı)' : 'Bağış Notu (İsteğe bağlı)'}
            </label>
            <input type="text" name="share" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder={mode === 'hisse' ? "Örn: 2 Hisse veya vekalet için not" : "Eklemek istediğiniz not"} />
          </div>
        </div>

        {state?.error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            {state.error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isPending} 
          className={`w-full py-4 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-75 flex justify-center items-center ${mode === 'hisse' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'}`}
        >
          {isPending ? 'Gönderiliyor...' : mode === 'hisse' ? 'Kaydımı Tamamla' : 'Bağışımı Tamamla'}
        </button>
      </form>
    </div>
  )
}
