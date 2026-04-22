import { prisma } from '@/lib/prisma'
import ReceiptManager from './ReceiptManager'

export const dynamic = 'force-dynamic'

export default async function ReceiptsPage() {
  const registrations = await prisma.registration.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ödeme Makbuzları</h2>
          <p className="text-sm text-slate-500 mt-1">Ödeme tahsil edilen müşteriler için makbuz yazdırın.</p>
        </div>
      </div>

      <ReceiptManager 
        registrations={JSON.parse(JSON.stringify(registrations))} 
        settings={JSON.parse(JSON.stringify(settings))} 
      />
    </div>
  )
}
