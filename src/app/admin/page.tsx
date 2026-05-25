import { prisma } from '@/lib/prisma'
import ExportButtons from './ExportButtons'
import RegistrationTable from './RegistrationTable'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const registrations = await prisma.registration.findMany({
    where: {
      isDonation: false
    },
    include: {
      animalShares: {
        include: {
          animal: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const groups = await prisma.kurbanGroup.findMany({
    where: {
      isDonation: false
    },
    orderBy: {
      price: 'asc'
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hissedarlar (Kayıtlar)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Toplam {registrations.length} hissedar kaydı bulunuyor.
          </p>
        </div>
        <ExportButtons data={JSON.parse(JSON.stringify(registrations))} />
      </div>

      <RegistrationTable 
        initialRegistrations={JSON.parse(JSON.stringify(registrations))} 
        type="standard" 
        kurbanGroups={JSON.parse(JSON.stringify(groups))}
      />
    </div>
  )
}
