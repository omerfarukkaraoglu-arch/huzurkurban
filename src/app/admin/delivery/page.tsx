import { prisma } from '@/lib/prisma'
import DeliveryManager from './DeliveryManager'

export const dynamic = 'force-dynamic'

export default async function DeliveryPage() {
  const animals = await prisma.animal.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      shareholders: {
        include: {
          registration: true
        }
      }
    }
  })
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Teslimat Takibi (Hayvan Bazlı)</h2>
          <p className="text-slate-500 text-sm mt-1">Hayvan kesim ve teslimat süreçlerini yönetin.</p>
        </div>
      </div>

      <DeliveryManager initialAnimals={animals} />
    </div>
  )
}
