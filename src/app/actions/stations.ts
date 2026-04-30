'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getStations() {
  return await prisma.station.findMany({
    orderBy: { order: 'asc' }
  })
}

export async function createStation(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const status = formData.get('status') as string
    const order = parseInt(formData.get('order') as string || '0')

    if (!name || !status) {
      return { success: false, error: 'İsim ve durum gereklidir.' }
    }

    await prisma.station.create({
      data: { name, status, order }
    })

    revalidatePath('/admin/stations')
    revalidatePath('/admin/users')
    return { success: true, message: 'İstasyon oluşturuldu.' }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Bu isimde bir istasyon zaten var.' }
    }
    return { success: false, error: 'Hata oluştu.' }
  }
}

export async function deleteStation(id: string) {
  try {
    await prisma.station.delete({ where: { id } })
    revalidatePath('/admin/stations')
    revalidatePath('/admin/users')
    return { success: true, message: 'İstasyon silindi.' }
  } catch (error) {
    return { success: false, error: 'İstasyon silinemedi. Bağlı kullanıcılar olabilir.' }
  }
}
