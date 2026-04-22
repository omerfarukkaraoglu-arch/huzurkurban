import Navbar from '@/components/Navbar'
import DeliveryTracker from './DeliveryTracker'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function TeslimatPage() {
  const s = await prisma.settings.findUnique({ where: { id: 'singleton' } })
  const settings = s || {
    siteTitle: 'Huzur Kurban', 
    phone: '0551 343 18 88', 
    whatsapp: '0551 343 18 88',
    menuConfig: '[]'
  } as any

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Navbar settings={settings} />

      <div className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Teslimat ve Kargo Takibi</h1>
          <p className="text-slate-600">Lütfen sisteme kayıtlı olduğunuz telefon numarasını giriniz.</p>
        </div>

        <DeliveryTracker />
      </div>
    </div>
  )
}
