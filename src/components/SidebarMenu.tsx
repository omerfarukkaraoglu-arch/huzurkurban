'use client'

import { useEffect, useState } from 'react'
import * as LucideIcons from 'lucide-react'

export default function SidebarMenu({ isOpen, onClose, onOpenAppointment, whatsapp, menuConfig }: { isOpen: boolean, onClose: () => void, onOpenAppointment: () => void, whatsapp: string, menuConfig?: string }) {
  const [mounted, setMounted] = useState(false)
  
  const cleanWhatsapp = whatsapp?.replace(/\s+/g, '').replace(/^0/, '90') || '905513431888'

  const actions = [
    { id: 'kayit', title: 'Hisse Kaydı', icon: 'Tractor', target: '#kayit-formu', color: 'hover:bg-emerald-50 text-emerald-700' },
    { id: 'bagis', title: 'Bağış Yap', icon: 'HeartHandshake', target: '#kayit-formu', color: 'hover:bg-amber-50 text-amber-700' },
    { id: 'sorgula', title: 'Kurbanını Gör', icon: 'ScanSearch', target: '#kurbanini-gor', color: 'hover:bg-blue-50 text-blue-700' },
    { id: 'teslimat', title: 'Teslimat Sorgula', icon: 'Truck', target: 'external', url: '/teslimat', color: 'hover:bg-teal-50 text-teal-700' },
    { id: 'hakkimizda', title: 'Hakkımızda', icon: 'Info', target: '#nasil-calisir', color: 'hover:bg-slate-100 text-slate-800' },
    { id: 'sss', title: 'Sıkça Sorulan Sorular', icon: 'HelpCircle', target: '#sss', color: 'hover:bg-slate-50 text-slate-700' },
    { id: 'randevu', title: 'Randevu Oluştur', icon: 'CalendarCheck', target: 'modal', color: 'hover:bg-purple-50 text-purple-700' },
    { id: 'whatsapp', title: 'WhatsApp İletişimi', icon: 'MessageCircle', target: 'external', url: `https://wa.me/${cleanWhatsapp}`, color: 'hover:bg-[#25D366]/10 text-[#25D366]' },
  ]

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!mounted) return null

  const handleAction = (item: any) => {
    onClose()
    if (item.target === 'modal') {
      setTimeout(() => onOpenAppointment(), 300)
    } else if (item.target === 'external') {
      // Internal links (start with /) should navigate in same tab
      // External links (start with http) should open in new tab
      if (item.url?.startsWith('/')) {
        window.location.href = item.url
      } else {
        window.open(item.url, '_blank')
      }
    } else {
      // Anchor target like #kayit-formu
      const el = document.querySelector(item.target)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
          if (item.id === 'bagis') {
            window.dispatchEvent(new CustomEvent('change-form-mode', { detail: 'bagis' }))
          } else if (item.id === 'kayit') {
            window.dispatchEvent(new CustomEvent('change-form-mode', { detail: 'hisse' }))
          }
        }, 300)
      } else {
        // Element not found on current page, navigate to homepage with anchor
        window.location.href = '/' + item.target
      }
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[300px] bg-white z-[160] shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">H</span>
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">Menü</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
        </div>

        <div className="py-4 px-3 flex flex-col gap-2">
          {actions.map((item: any) => {
            const Icon = (LucideIcons as any)[item.icon] || LucideIcons.CircleDot
            return (
              <button
                key={item.id}
                onClick={() => handleAction(item)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all font-semibold border border-transparent hover:border-slate-200 ${item.color}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-base">{item.title}</span>
              </button>
            )
          })}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-4">Müşteri Destek</p>
            <a href="tel:05513431888" className="text-emerald-600 font-bold text-lg">0551 343 18 88</a>
        </div>
      </div>
    </>
  )
}
