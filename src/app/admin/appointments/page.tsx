import { prisma } from '@/lib/prisma'

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
          <h2 className="text-2xl font-bold text-slate-800">Randevu Talepleri</h2>
          <p className="text-sm text-slate-500 mt-1">Toplam {appointments.length} randevu başvurusu.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                <th className="p-4 font-semibold">Tarih</th>
                <th className="p-4 font-semibold">Saat</th>
                <th className="p-4 font-semibold">Ad Soyad</th>
                <th className="p-4 font-semibold">Telefon</th>
                <th className="p-4 font-semibold">Durum</th>
                <th className="p-4 font-semibold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Henüz randevu talebi bulunmuyor.</td>
                </tr>
              ) : (
                appointments.map((app: any) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium">{new Date(app.date).toLocaleDateString('tr-TR')}</td>
                    <td className="p-4 text-slate-600 font-bold text-blue-600">{app.timeSlot}</td>
                    <td className="p-4 text-slate-800 font-bold">{app.fullName}</td>
                    <td className="p-4 text-slate-600">{app.phone}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${app.status === 'BEKLEMEDE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                       <button className="text-emerald-600 font-bold mr-3">Onayla</button>
                       <button className="text-red-500 font-bold">İptal</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
