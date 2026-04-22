'use client'

import { useState } from 'react'
import AdminSidebar from './AdminSidebar'

export default function AdminHeader({ user, role }: { user: any, role: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-white font-bold text-xl leading-none">H</span>
            </div>
            <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">
                Huzur Kurban <span className="text-emerald-600">Admin</span>
                </h1>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{role} PANELİ</span>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-700">{user?.fullName || user?.username}</span>
                <span className="text-[10px] font-medium text-slate-400">Hoş geldiniz</span>
            </div>

            <button 
              onClick={() => setIsMenuOpen(true)}
              className="bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 px-4 py-2.5 rounded-2xl flex items-center gap-3 transition-all border border-slate-200 hover:border-emerald-200 group shadow-sm"
            >
              <span className="font-bold text-sm hidden sm:block">Menü</span>
              <div className="flex flex-col gap-1">
                <span className="w-5 h-0.5 bg-current rounded-full transition-all group-hover:w-3"></span>
                <span className="w-5 h-0.5 bg-current rounded-full"></span>
                <span className="w-5 h-0.5 bg-current rounded-full transition-all group-hover:w-4"></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <AdminSidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        user={user}
        role={role}
      />
    </>
  )
}
