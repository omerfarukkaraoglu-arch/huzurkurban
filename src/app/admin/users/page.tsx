import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import UserList from './UserList'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await getSession()
  
  // Security check redundant with middleware but good for safety
  if (session?.user?.role !== 'SUPERADMIN') {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
        Bu sayfaya erişim yetkiniz bulunmamaktadır.
      </div>
    )
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      station: true,
      stationId: true,
      createdAt: true
    }
  })

  const stations = await prisma.station.findMany({
    orderBy: { order: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Kullanıcı Yönetimi</h2>
          <p className="text-sm text-slate-500 mt-1">Sisteme giriş yapabilecek kişileri yönetin.</p>
        </div>
      </div>

      <UserList 
        users={JSON.parse(JSON.stringify(users))} 
        stations={stations}
        currentUserId={session.user.id} 
      />
    </div>
  )
}
