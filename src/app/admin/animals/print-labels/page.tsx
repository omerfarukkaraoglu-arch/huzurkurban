import { prisma } from '@/lib/prisma'
import PrintLabelsClient from './PrintLabelsClient'

export default async function PrintLabelsPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids: idsParam } = await searchParams
  const ids = idsParam?.split(',') || []
  
  if (ids.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-slate-900 font-black text-xl">Yazdırılacak hayvan seçilmedi.</div>
          <p className="text-slate-600 mt-2 font-medium">Lütfen hayvan listesinden seçim yapıp tekrar deneyin.</p>
        </div>
      </div>
    )
  }

  const animals = await prisma.animal.findMany({
    where: { id: { in: ids } },
    include: {
      shareholders: {
        include: {
          registration: true
        }
      }
    },
    orderBy: { order: 'asc' }
  })

  return <PrintLabelsClient animals={animals} />
}
