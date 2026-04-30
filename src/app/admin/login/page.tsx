'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, { error: '' })

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-emerald-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
            H
          </div>
          <h1 className="text-2xl font-bold">Huzur Kurban</h1>
          <p className="text-emerald-100 mt-1">Yönetici Girişi</p>
        </div>

        <form action={formAction} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kullanıcı Adı</label>
            <input
              type="text"
              name="username"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 bg-white placeholder:text-slate-500 font-medium"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Şifre</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 bg-white placeholder:text-slate-500 font-medium"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 text-center">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-75"
          >
            {isPending ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="p-4 bg-slate-50 text-center text-xs text-slate-600 font-bold border-t border-slate-100">
          © 2026 Huzur Kurban Yönetim Paneli
        </div>
      </div>
    </div>
  )
}
