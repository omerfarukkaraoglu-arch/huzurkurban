import { prisma } from '@/lib/prisma'
import SettingsForm from './SettingsForm'
import GroupManager from './GroupManager'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' }
  })
  const groups = await prisma.kurbanGroup.findMany({
    orderBy: { price: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sistem Ayarları</h2>
        </div>
        <Link href="/admin" className="text-emerald-600 hover:text-emerald-700 font-medium">
          ← Geri Dön (Kayıtlar)
        </Link>
      </div>

      <SettingsForm initialData={settings} />

      <div className="mt-12 pt-8 border-t border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Kurban Grupları Yönetimi</h3>
        <GroupManager initialGroups={groups} />
      </div>
    </div>
  )
}
