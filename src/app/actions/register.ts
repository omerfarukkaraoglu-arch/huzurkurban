'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function submitRegistration(prevState: any, formData: FormData) {
  try {
    const data = {
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      group: formData.get('group') as string,
      share: formData.get('share') as string,
      isDonation: formData.get('isDonation') === 'true',
    }

    if (!data.fullName || !data.phone || !data.group) {
      return { success: false, error: 'Lütfen zorunlu alanları (Ad, Telefon, Grup) doldurunuz.', message: '' }
    }

    await prisma.registration.create({
      data,
    })

    revalidatePath('/admin')
    
    return { success: true, message: 'Kaydınız başarıyla alınmıştır. En kısa sürede sizinle iletişime geçeceğiz!', error: '' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Kayıt işlemi sırasında bir hata oluştu. Lütfen telefon ile ulaşınız.', message: '' }
  }
}
export async function deleteRegistrations(ids: string[]) {
  try {
    await prisma.registration.deleteMany({
      where: {
        id: { in: ids }
      }
    })
    revalidatePath('/admin')
    revalidatePath('/admin/donations')
    return { success: true, message: `${ids.length} kayıt silindi.`, error: '' }
  } catch (error) {
    return { success: false, error: 'Kayıtlar silinirken hata oluştu.', message: '' }
  }
}
