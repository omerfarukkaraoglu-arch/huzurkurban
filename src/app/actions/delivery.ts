'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateAnimalDeliveryStatus(animalId: string, status: string) {
  try {
    await prisma.animal.update({
      where: { id: animalId },
      data: { deliveryStatus: status }
    })
    revalidatePath('/admin/delivery')
    revalidatePath('/teslimat')
    return { success: true, message: 'Durum güncellendi.', error: '' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Güncelleme başarısız oldu.', message: '' }
  }
}

export async function bulkUpdateAnimalDeliveryStatus(animalIds: string[], status: string) {
  try {
    await prisma.animal.updateMany({
      where: { id: { in: animalIds } },
      data: { deliveryStatus: status }
    })
    revalidatePath('/admin/delivery')
    revalidatePath('/teslimat')
    return { success: true, message: `${animalIds.length} hayvan güncellendi.`, error: '' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Toplu güncelleme başarısız oldu.', message: '' }
  }
}

export async function getDeliveryStatusByPhone(phone: string) {
  try {
    if (!phone) return { success: false, data: null, error: 'Telefon numarası gereklidir.' }
    
    // Find registrations by phone
    // For each registration, find the animal
    const registrations = await prisma.registration.findMany({
      where: { phone: { contains: phone.trim() } },
      include: {
        animalShares: {
          include: {
            animal: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (registrations.length === 0) {
      return { success: false, data: null, error: 'Bu telefon numarasına ait kayıt bulunamadı.' }
    }

    // Flatten data: A user could have multiple registrations, and each could be assigned an animal.
    const results: any[] = []
    
    registrations.forEach(reg => {
      // If customer has an assigned animal via shareholder
      if (reg.animalShares && reg.animalShares.length > 0) {
        reg.animalShares.forEach(share => {
           if (share.animal) {
             results.push({
               registrationId: reg.id,
               fullName: reg.fullName,
               group: reg.group,
               registrationStatus: reg.status,
               isDonation: reg.isDonation,
               animalId: share.animal.id,
               earTag: share.animal.earTag,
               animalGroup: share.animal.groupName,
               deliveryStatus: share.animal.deliveryStatus
             })
           }
        })
      } else {
        // Customer is registered but not yet assigned to an animal
        results.push({
          registrationId: reg.id,
          fullName: reg.fullName,
          group: reg.group,
          registrationStatus: reg.status,
          isDonation: reg.isDonation,
          animalId: null,
          earTag: null,
          animalGroup: null,
          deliveryStatus: 'BEKLEMEDE' // Default status if not assigned
        })
      }
    })

    return { success: true, data: results, error: '' }
  } catch (error) {
    console.error(error)
    return { success: false, data: null, error: 'Sorgulama sırasında hata oluştu.' }
  }
}
