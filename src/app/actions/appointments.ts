'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function bookAppointment(prevState: any, formData: FormData) {
  try {
    const data = {
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      date: formData.get('date') as string,
      timeSlot: formData.get('timeSlot') as string,
    }

    if (!data.fullName || !data.phone || !data.date || !data.timeSlot) {
      return { success: false, error: 'Lütfen tüm alanları doldurunuz.', message: '' }
    }

    await prisma.appointment.create({ data })

    revalidatePath('/admin/appointments')
    
    return { success: true, message: 'Randevu talebiniz alınmıştır. Sizi onay için arayacağız.', error: '' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Randevu alınırken bir hata oluştu.', message: '' }
  }
}
