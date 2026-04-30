'use client'

import { useActionState, useTransition } from 'react'
import { createUser, deleteUser } from '@/app/actions/users'

export default function UserList({ users, stations, currentUserId }: { users: any[], stations: any[], currentUserId: string }) {
  const [state, formAction, isPending] = useActionState(createUser, { error: '' } as any)
  const [isDeleting, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      startTransition(async () => {
        await deleteUser(id)
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Liste */}
      <div className="lg:col-span-2 space-y-4">
        {users.map((user: any) => (
          <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${user.role === 'SUPERADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-800">
                  {user.fullName || user.username} 
                  {user.id === currentUserId && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Siz</span>}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>@{user.username}</span>
                  <span>•</span>
                  <span className={`font-medium ${user.role === 'SUPERADMIN' ? 'text-amber-600' : 'text-slate-600'}`}>{user.role}</span>
                  {user.station && (
                    <>
                      <span>•</span>
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{user.station.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(user.id)}
              disabled={isDeleting || user.id === currentUserId}
              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-30"
              title={user.id === currentUserId ? 'Kendi hesabınızı silemezsiniz' : 'Sil'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Yeni Kullanıcı Formu */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          Yeni Kullanıcı Ekle
        </h3>
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kullanıcı Adı *</label>
            <input name="username" required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre *</label>
            <input type="password" name="password" required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
            <input name="fullName" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol *</label>
            <select name="role" required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="OPERATOR">Operatör</option>
              <option value="SUPERADMIN">Süper Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">İstasyon Ataması</label>
            <select name="stationId" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">İstasyon Seçin (Opsiyonel)</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Operatörlerin giriş yaptıklarında yönlendirileceği bölüm.</p>
          </div>

          {(state as any)?.error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{(state as any).error}</div>}
          {(state as any)?.success && <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg">{(state as any).message}</div>}

          <button type="submit" disabled={isPending} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all disabled:opacity-50">
            {isPending ? 'Oluşturuluyor...' : 'Ekle'}
          </button>
        </form>
      </div>
    </div>
  )
}
