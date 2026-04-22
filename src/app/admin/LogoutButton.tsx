'use client'

import { logoutAction } from '@/app/actions/auth'

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button 
        type="submit" 
        className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        Güvenli Çıkış
      </button>
    </form>
  )
}
