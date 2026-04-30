'use client'

import { useActionState, useState } from 'react'
import { updateSettings } from '@/app/actions/settings'

const initialState = {
  success: false,
  message: '',
  error: ''
}

export default function SettingsForm({ initialData }: { initialData: any }) {
  const [state, formAction, isPending] = useActionState(updateSettings, initialState)
  const [activeTab, setActiveTab] = useState('general')

  const TabButton = ({ id, title, icon }: { id: string, title: string, icon: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
        activeTab === id 
          ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span>{icon}</span>
      {title}
    </button>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Site İçerik Yönetimi</h3>
          <p className="text-sm text-slate-500">Tüm ana sayfa metinlerini ve görsellerini buradan güncelleyebilirsiniz.</p>
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
          Değişiklikleri Kaydet
        </button>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto bg-white">
        <TabButton id="general" title="Genel & İletişim" icon="⚙️" />
        <TabButton id="hero" title="Giriş (Hero)" icon="🖼️" />
        <TabButton id="about" title="Hakkımızda" icon="📖" />
        <TabButton id="features" title="Neden Biz?" icon="⭐" />
      </div>

      <form action={formAction} className="p-6">
        {/* GENEL AYARLAR */}
        <div className={activeTab === 'general' ? 'space-y-6' : 'hidden'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Site Başlığı (Tarayıcıda Görünür)</label>
              <input type="text" name="siteTitle" defaultValue={initialData?.siteTitle} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">İletişim Telefonu</label>
              <input type="text" name="phone" defaultValue={initialData?.phone} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp Numarası</label>
              <input type="text" name="whatsapp" defaultValue={initialData?.whatsapp} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Adres Bilgisi</label>
              <input type="text" name="address" defaultValue={initialData?.address} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" />
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-1">Slider Görselleri (Toplu Değiştirme)</label>
            <input type="file" name="sliderImages" accept="image/*" multiple className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
            <p className="text-xs text-slate-500 mt-2 italic">Not: Yeni seçim yapmazsanız mevcut görseller korunur.</p>
          </div>
        </div>

        {/* HERO AYARLARI */}
        <div className={activeTab === 'hero' ? 'space-y-6' : 'hidden'}>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Hero Ana Başlık</label>
            <input type="text" name="heroTitle" defaultValue={initialData?.heroTitle} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Hero Alt Metni</label>
            <textarea name="heroSubText" rows={3} defaultValue={initialData?.heroSubText} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Hero Vurgu Metni (Kayıtlar Başladı vb.)</label>
            <input type="text" name="heroAccent" defaultValue={initialData?.heroAccent} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-orange-600 font-semibold bg-white" />
          </div>
        </div>

        {/* HAKKIMIZDA AYARLARI */}
        <div className={activeTab === 'about' ? 'space-y-6' : 'hidden'}>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Hakkımızda/İbadet Bölümü Başlığı</label>
            <input type="text" name="aboutTitle" defaultValue={initialData?.aboutTitle} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Hakkımızda/İbadet Bölümü Metni</label>
            <textarea name="aboutText" rows={3} defaultValue={initialData?.aboutText} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" />
          </div>
        </div>

        {/* ÖZELLİKLER AYARLARI */}
        <div className={activeTab === 'features' ? 'space-y-6' : 'hidden'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Neden Biz? Başlığı</label>
              <input type="text" name="featuresTitle" defaultValue={initialData?.featuresTitle} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Neden Biz? Alt Açıklama</label>
              <input type="text" name="featuresSub" defaultValue={initialData?.featuresSub} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-emerald-50/30 rounded-lg border border-emerald-100">
              <label className="block text-xs font-black text-emerald-800 uppercase mb-2">1. Özellik Kartı</label>
              <input type="text" name="f1Title" defaultValue={initialData?.f1Title} className="w-full px-3 py-2 text-sm rounded border border-emerald-200 mb-2 font-bold text-slate-900 bg-white" />
              <textarea name="f1Text" rows={3} defaultValue={initialData?.f1Text} className="w-full px-3 py-2 text-sm rounded border border-emerald-200 text-slate-900 bg-white" />
            </div>
            <div className="p-4 bg-blue-50/30 rounded-lg border border-blue-100">
              <label className="block text-xs font-black text-blue-800 uppercase mb-2">2. Özellik Kartı</label>
              <input type="text" name="f2Title" defaultValue={initialData?.f2Title} className="w-full px-3 py-2 text-sm rounded border border-blue-200 mb-2 font-bold text-slate-900 bg-white" />
              <textarea name="f2Text" rows={3} defaultValue={initialData?.f2Text} className="w-full px-3 py-2 text-sm rounded border border-blue-200 text-slate-900 bg-white" />
            </div>
            <div className="p-4 bg-teal-50/30 rounded-lg border border-teal-100">
              <label className="block text-xs font-black text-teal-800 uppercase mb-2">3. Özellik Kartı</label>
              <input type="text" name="f3Title" defaultValue={initialData?.f3Title} className="w-full px-3 py-2 text-sm rounded border border-teal-200 mb-2 font-bold text-slate-900 bg-white" />
              <textarea name="f3Text" rows={3} defaultValue={initialData?.f3Text} className="w-full px-3 py-2 text-sm rounded border border-teal-200 text-slate-900 bg-white" />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          {state?.error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-center gap-2">⚠️ {state.error}</div>}
          {state?.success && <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100 flex items-center gap-2">✨ {state.message}</div>}

          <div className="flex justify-end">
            <button 
              id="save-settings-btn"
              type="submit" 
              disabled={isPending} 
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 disabled:opacity-70 disabled:shadow-none translate-y-0 active:translate-y-1"
            >
              {isPending ? 'Güncelleniyor...' : 'Ayarları Kaydet'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
