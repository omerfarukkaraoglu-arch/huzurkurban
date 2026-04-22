import { prisma } from '@/lib/prisma'
import ExportButtons from '../ExportButtons'
import RegistrationTable from '../RegistrationTable'

export const dynamic = 'force-dynamic'

export default async function DonationsPage() {
  const registrations = await prisma.registration.findMany({
    where: {
      isDonation: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bağış Hisse Kayıtları</h2>
          <p className="text-sm text-slate-500 mt-1">
            Toplam {registrations.length} bağış kaydı bulunuyor.
          </p>
        </div>
        <ExportButtons data={JSON.parse(JSON.stringify(registrations))} />
      </div>

      <RegistrationTable 
        initialRegistrations={JSON.parse(JSON.stringify(registrations))} 
        type="donation" 
      />
    </div>
  )
}
