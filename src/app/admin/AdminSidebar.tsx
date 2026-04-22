'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default function AdminSidebar({ 
  isOpen, 
  onClose, 
  user, 
  role 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: any, 
  role: string 
}) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

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

  const menuItems = [
    { title: 'Kayıtlar', href: '/admin', icon: '📝' },
    { title: 'Hayvanlar', href: '/admin/animals', icon: '🐄' },
    { title: 'Bağışlar', href: '/admin/donations', icon: '💖' },
    { title: 'Randevular', href: '/admin/appointments', icon: '📅' },
    { title: 'Makbuzlar', href: '/admin/receipts', icon: '🧾' },
    { title: 'Teslimat', href: '/admin/delivery', icon: '🚚' },
  ]

  if (role === 'SUPERADMIN') {
    menuItems.push(
      { title: 'SSS', href: '/admin/faqs', icon: '❓' },
      { title: 'Kullanıcılar', href: '/admin/users', icon: '👤' },
      { title: 'Ayarlar', href: '/admin/settings', icon: '⚙️' }
    )
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
        className={`fixed top-0 right-0 h-full w-[300px] bg-white z-[160] shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-white font-bold text-xl leading-none">H</span>
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-slate-800 leading-tight">Admin</span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{role}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 bg-emerald-50/50 border-b border-slate-100">
            <p className="text-xs text-slate-500 font-medium">Giriş Yapan Panelist</p>
            <p className="font-bold text-slate-700">{user?.fullName || user?.username}</p>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-semibold ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm tracking-tight">{item.title}</span>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 space-y-4 bg-slate-50">
           <LogoutButton />
           <p className="text-[10px] text-center text-slate-400 font-medium">Huzur Kurban v1.0.0</p>
        </div>
      </div>
    </>
  )
}
