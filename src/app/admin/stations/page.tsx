import { getStations } from '@/app/actions/stations'
import StationList from './StationList'

export default async function StationsPage() {
  const stations = await getStations()
  
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">İstasyon Yönetimi</h1>
          <p className="text-slate-700 text-sm">QR okuma aşamalarını ve durumlarını yönetin.</p>
        </div>
      </div>

      <StationList initialStations={stations} />
    </div>
  )
}
