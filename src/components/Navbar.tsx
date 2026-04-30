'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SidebarMenu from './SidebarMenu'
import AppointmentModal from './AppointmentModal'

export default function Navbar({ settings }: { settings: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false)
  const router = useRouter()

  const cleanWhatsapp = (settings.whatsapp || settings.phone)?.replace(/\s+/g, '').replace(/^0/, '90') || '905513431888'
  const actions = [
    { id: 'kayit', title: 'Hisse Kaydı', icon: 'Tractor', target: '#kayit-formu' },
    { id: 'bagis', title: 'Bağış Yap', icon: 'HeartHandshake', target: '#kayit-formu' },
    { id: 'sorgula', title: 'Kurbanını Gör', icon: 'ScanSearch', target: '#kurbanini-gor' },
    { id: 'teslimat', title: 'Teslimat Sorgula', icon: 'Truck', target: 'external', url: '/teslimat' },
    { id: 'randevu', title: 'Randevu Al', icon: 'CalendarCheck', target: 'modal' },
    { id: 'whatsapp', title: 'WhatsApp', icon: 'MessageCircle', target: 'external', url: `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent("Merhaba, kurban ile alakalı bilgi almak istiyorum.")}` },
  ]

  const handleAction = (item: any) => {
    if (item.target === 'modal') {
      setIsAppointmentOpen(true)
    } else if (item.target === 'external') {
      if (item.url.startsWith('/')) {
        router.push(item.url)
      } else {
        window.open(item.url, '_blank')
      }
    } else if (item.target.startsWith('#')) {
      if (window.location.pathname !== '/') {
        router.push('/' + item.target)
      } else {
        const element = document.querySelector(item.target)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  return (
    <>
      <nav className="fixed w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link href="/" className="flex items-center gap-3 group transition-all">
              <div className="relative h-14 w-14 transition-transform group-hover:scale-110">
                <img 
                  src="/logo-icon.png" 
                  alt={settings.siteTitle} 
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-extrabold text-2xl tracking-tighter text-slate-900 group-hover:text-emerald-700 transition-colors uppercase">
                {settings.siteTitle}
              </span>
            </Link>

            <div className="hidden lg:flex items-center space-x-6 z-10 transition-all">
              {actions.map((item: any) => {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAction(item)}
                    className="text-slate-600 hover:text-emerald-600 transition-colors font-semibold text-sm drop-shadow-sm"
                  >
                    {item.title}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-4">
              <Link href="/admin/login" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 hidden lg:block transition-colors">
                Yönetici Girişi
              </Link>
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 w-12 h-12 rounded-2xl flex lg:hidden items-center justify-center transition-all border border-slate-200 hover:border-emerald-200 group"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="w-6 h-0.5 bg-current rounded-full transition-all group-hover:w-4"></span>
                  <span className="w-6 h-0.5 bg-current rounded-full"></span>
                  <span className="w-6 h-0.5 bg-current rounded-full transition-all group-hover:w-5"></span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <SidebarMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onOpenAppointment={() => setIsAppointmentOpen(true)}
        whatsapp={settings.whatsapp || settings.phone}
        phone={settings.phone}
        menuConfig={settings.menuConfig}
      />

      <AppointmentModal 
        isOpen={isAppointmentOpen} 
        onClose={() => setIsAppointmentOpen(false)} 
      />
    </>
  )
}
