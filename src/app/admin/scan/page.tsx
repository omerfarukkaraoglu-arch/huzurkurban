import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import ScanClient from './ScanClient'
import { redirect } from 'next/navigation'

export default async function ScanPage() {
  const session = await getSession()
  if (!session?.user) redirect('/admin/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { station: true }
  })

  if (!user) redirect('/admin/login')

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Karekod Okuma İstasyonu</h1>
        <p className="text-slate-500">Hayvan veya hisse üzerindeki karekodu okutarak durumu güncelleyin.</p>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Aktif İstasyon</div>
          <div className="text-lg font-bold text-emerald-900">{user.station?.name || 'ATANMAMIŞ'}</div>
        </div>
        <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
          {user.username[0].toUpperCase()}
        </div>
      </div>

      {!user.station ? (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="font-bold text-amber-900 mb-2">İstasyon Atanmamış</h3>
            <p className="text-amber-800 text-sm">
                İşlem yapabilmek için yöneticiniz tarafından bir çalışma istasyonu atanmalıdır.
            </p>
        </div>
      ) : (
        <ScanClient userStation={user.station.status} stationName={user.station.name} />
      )}
    </div>
  )
}
