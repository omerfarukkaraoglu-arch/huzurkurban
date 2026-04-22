import { getSession } from '@/lib/session'
import AdminHeader from './AdminHeader'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const role = session?.user?.role || 'OPERATOR'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminHeader user={session?.user} role={role} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
