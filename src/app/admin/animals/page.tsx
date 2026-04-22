import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AnimalManager from './AnimalManager'
import AnimalExportButtons from './AnimalExportButtons'

export const dynamic = 'force-dynamic'

export default async function AnimalsPage() {
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

  const registrations = await prisma.registration.findMany({
    orderBy: { fullName: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hayvan Kayıtları</h2>
          <p className="text-sm text-slate-500 mt-1">Toplam {animals.length} hayvan kayıtlı.</p>
        </div>
        <div className="flex items-center gap-3">
          <AnimalExportButtons data={JSON.parse(JSON.stringify(animals))} />
          <Link href="/admin" className="text-emerald-600 hover:text-emerald-700 font-medium">
            ← Geri Dön
          </Link>
        </div>
      </div>

      <AnimalManager
        initialAnimals={JSON.parse(JSON.stringify(animals))}
        registrations={JSON.parse(JSON.stringify(registrations))}
      />
    </div>
  )
}
