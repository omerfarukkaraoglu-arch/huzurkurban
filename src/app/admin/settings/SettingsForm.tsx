'use client'

import { useActionState } from 'react'
import { updateSettings } from '@/app/actions/settings'

const initialState = {
  success: false,
  message: '',
  error: ''
}

export default function SettingsForm({ initialData }: { initialData: any }) {
  const [state, formAction, isPending] = useActionState(updateSettings, initialState)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Site Ayarları</h3>
          <p className="text-sm text-slate-500">Ziyaretçi sitesindeki fiyatları ve metinleri buradan değiştirebilirsiniz.</p>
        </div>
        <button 
          onClick={() => (document.getElementById('save-settings-btn') as HTMLButtonElement)?.click()}
          type="button"
          disabled={isPending}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all shadow-md shadow-emerald-100 disabled:opacity-70 flex items-center gap-2"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : '✓'}
          Kaydet
        </button>
      </div>

      <form action={formAction} className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Site Başlığı</label>
            <input type="text" name="siteTitle" defaultValue={initialData?.siteTitle || 'Huzur Kurban'} required className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">İletişim Telefonu</label>
            <input type="text" name="phone" defaultValue={initialData?.phone || '0551 343 18 88'} required className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Hattı</label>
            <input type="text" name="whatsapp" defaultValue={initialData?.whatsapp || '0551 343 18 88'} required className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="905513431888 formatında" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Açılış (Hero) Sloganı</label>
            <input type="text" name="heroText" defaultValue={initialData?.heroText || 'Kurbanınız Emin Ellerde'} required className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Şirket / Tesis Adresi</label>
            <input type="text" name="address" defaultValue={initialData?.address || 'İstanbul, Türkiye'} required className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        <div className="pb-8 border-b border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Slider Görselleri (Toplu Seçim)</label>
          <input type="file" name="sliderImages" accept="image/*" multiple className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          <p className="text-xs text-slate-500 mt-2">NOT: Buraya yeni fotoğraf seçip eklerseniz, eski slider fotoğraflarınızın tümü silinir ve yenileriyle değiştirilir. Hiçbir şey seçmezseniz eski görseller kalmaya devam eder.</p>
        </div>




        {state?.error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{state.error}</div>}
        {state?.success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">{state.message}</div>}

        <div className="flex justify-end">
          <button 
            id="save-settings-btn"
            type="submit" 
            disabled={isPending} 
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            {isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
