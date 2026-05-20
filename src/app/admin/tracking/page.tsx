import { prisma } from '@/lib/prisma'
import TrackingManager from './TrackingManager'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TrackingPage() {
  const animals = await prisma.animal.findMany({
    include: {
      shareholders: {
        include: {
          registration: true
        }
      }
    },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  const stations = await prisma.station.findMany({
    orderBy: { order: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Kurban Takip Paneli</h2>
          <p className="text-sm text-slate-500 mt-1">
            Kurbanlıkların anlık olarak hangi istasyonda/aşamada olduğunu takip edin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-emerald-600 hover:text-emerald-700 font-medium">
            ← Geri Dön
          </Link>
        </div>
      </div>

      <TrackingManager 
        initialAnimals={JSON.parse(JSON.stringify(animals))}
        stations={JSON.parse(JSON.stringify(stations))}
      />
    </div>
  )
}
