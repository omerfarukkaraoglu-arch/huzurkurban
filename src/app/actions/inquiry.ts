'use server'

import { prisma } from '@/lib/prisma'

export async function findAnimalByInquiry(query: string) {
  if (!query || query.length < 3) {
    return { success: false, error: 'Lütfen en az 3 karakter girin.' }
  }

  try {
    // 1. Try to find by Ear Tag directly
    const animalByTag = await prisma.animal.findUnique({
      where: { earTag: query },
      include: {
        shareholders: {
          include: { registration: true }
        }
      }
    })

    if (animalByTag) {
      return { success: true, data: animalByTag }
    }

    // 2. Try to find by Shareholder Name or Phone
    const registrations = await prisma.registration.findMany({
      where: {
        OR: [
          { fullName: { contains: query } },
          { phone: { contains: query } }
        ]
      },
      include: {
        animalShares: {
          include: {
            animal: {
              include: {
                shareholders: {
                  include: { registration: true }
                }
              }
            }
          }
        }
      }
    })

    if (registrations.length > 0) {
      // Return the first found animal for these registrations
      const animals = registrations
        .flatMap(r => r.animalShares.map(as => as.animal))
        .filter((a, index, self) => self.findIndex(t => t.id === a.id) === index)

      if (animals.length > 0) {
        return { success: true, data: animals[0] } // Simply return the first one for now
      }
    }

    return { success: false, error: 'Eşleşen kurban kaydı bulunamadı.' }
  } catch (error) {
    console.error('Inquiry error:', error)
    return { success: false, error: 'Sorgulama sırasında bir hata oluştu.' }
  }
}
