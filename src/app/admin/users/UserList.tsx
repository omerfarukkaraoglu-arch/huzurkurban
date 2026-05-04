'use client'

import { useActionState, useTransition, useState, useEffect, useRef } from 'react'
import { createUser, deleteUser, updateUser } from '@/app/actions/users'

export default function UserList({ users, stations, currentUserId }: { users: any[], stations: any[], currentUserId: string }) {
  const [editingUser, setEditingUser] = useState<any>(null)
  
  // Use a wrapper to determine which action to call
  const formActionWrapper = async (prevState: any, formData: FormData) => {
    if (editingUser) {
      formData.append('id', editingUser.id)
      return updateUser(prevState, formData)
    }
    return createUser(prevState, formData)
  }

  const [state, formAction, isPending] = useActionState(formActionWrapper, { error: '' } as any)
  const [isDeleting, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // Reset form after successful creation/update
  useEffect(() => {
    if (state?.success) {
      if (!editingUser) {
        formRef.current?.reset()
      } else {
        setEditingUser(null)
      }
    }
  }, [state, editingUser])

  const handleDelete = (id: string) => {
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      startTransition(async () => {
        await deleteUser(id)
      })
    }
  }

  const handleEdit = (user: any) => {
    setEditingUser(user)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    if (formRef.current) formRef.current.reset()
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
                <div className="font-bold text-slate-900">
                  {user.fullName || user.username} 
                  {user.id === currentUserId && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Siz</span>}
                </div>
                <div className="text-xs text-slate-700 flex items-center gap-2">
                  <span>@{user.username}</span>
                  <span>•</span>
                  <span className={`font-medium ${user.role === 'SUPERADMIN' ? 'text-amber-600' : 'text-slate-700'}`}>{user.role}</span>
                  {user.station && (
                    <>
                      <span>•</span>
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{user.station.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(user)}
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                title="Düzenle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                disabled={isDeleting || user.id === currentUserId}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-30"
                title={user.id === currentUserId ? 'Kendi hesabınızı silemezsiniz' : 'Sil'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
          {editingUser ? (
            <>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Kullanıcıyı Düzenle
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              Yeni Kullanıcı Ekle
            </>
          )}
        </h3>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kullanıcı Adı *</label>
            <input 
              name="username" 
              defaultValue={editingUser?.username} 
              key={editingUser?.id + 'username'}
              required 
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Şifre {editingUser ? '(Değiştirmek istemiyorsanız boş bırakın)' : '*'}
            </label>
            <input 
              type="password" 
              name="password" 
              required={!editingUser} 
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
            <input 
              name="fullName" 
              defaultValue={editingUser?.fullName} 
              key={editingUser?.id + 'fullName'}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol *</label>
            <select 
              name="role" 
              defaultValue={editingUser?.role || 'OPERATOR'} 
              key={editingUser?.id + 'role'}
              required 
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="OPERATOR">Operatör</option>
              <option value="SUPERADMIN">Süper Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">İstasyon Ataması</label>
            <select 
              name="stationId" 
              defaultValue={editingUser?.stationId || ''} 
              key={editingUser?.id + 'stationId'}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
            >
              <option value="">İstasyon Seçin (Opsiyonel)</option>
              {stations.map((st: any) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-700 mt-1">Operatörlerin giriş yaptıklarında yönlendirileceği bölüm.</p>
          </div>

          {(state as any)?.error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{(state as any).error}</div>}
          {(state as any)?.success && <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg">{(state as any).message}</div>}

          <div className="flex gap-2">
            {editingUser && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-all"
              >
                Vazgeç
              </button>
            )}
            <button 
              type="submit" 
              disabled={isPending} 
              className={`flex-[2] py-3 text-white rounded-lg font-bold transition-all disabled:opacity-50 ${editingUser ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {isPending ? (editingUser ? 'Güncelleniyor...' : 'Oluşturuluyor...') : (editingUser ? 'Güncelle' : 'Ekle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
