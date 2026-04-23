import { prisma } from '@/lib/prisma'
import AppointmentTable from './AppointmentTable'

export const dynamic = 'force-dynamic'

export default async function AppointmentsPage() {
  const appointments = await prisma.appointment.findMany({
    orderBy: {
      date: 'asc'
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Randevu Talepleri</h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Toplam {appointments.length} randevu başvurusu bulundu.
          </p>
        </div>
      </div>

      <AppointmentTable appointments={appointments} />
    </div>
  )
}
