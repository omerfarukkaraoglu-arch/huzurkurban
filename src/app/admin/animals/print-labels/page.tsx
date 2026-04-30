import { prisma } from '@/lib/prisma'
import PrintLabelsClient from './PrintLabelsClient'

export default async function PrintLabelsPage({ searchParams }: { searchParams: { ids?: string } }) {
  const ids = searchParams.ids?.split(',') || []
  
  if (ids.length === 0) {
    return <div className="p-10 text-center">Yazdırılacak hayvan seçilmedi.</div>
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
