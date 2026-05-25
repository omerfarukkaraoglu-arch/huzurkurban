'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { put } from '@vercel/blob'
import * as XLSX from 'xlsx'

function parseShareCount(shareStr: string | null | undefined): number {
  if (!shareStr) return 1
  const trimmed = shareStr.trim()
  
  // E.g. "2/7" or "2/7 Hisse"
  const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*\d+/)
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10)
    return isNaN(num) || num <= 0 ? 1 : num
  }

  // E.g. "3 Hisse" or "3"
  const digitMatch = trimmed.match(/(\d+)/)
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10)
    return isNaN(num) || num <= 0 ? 1 : num
  }

  return 1
}

export async function createAnimal(prevState: any, formData: FormData) {
  try {
    const earTag = formData.get('earTag') as string
    const weightRaw = formData.get('weight') as string
    const groupName = formData.get('groupName') as string
    const note = formData.get('note') as string
    const imageFiles = formData.getAll('images') as File[]
    const validImages = imageFiles.filter(f => f && f.size > 0)
    const orderRaw = formData.get('order') as string
    const order = orderRaw ? parseInt(orderRaw) : 0

    if (!earTag) {
      return { success: false, error: 'Küpe numarası zorunludur.', message: '' }
    }

    const existing = await prisma.animal.findUnique({ where: { earTag } })
    if (existing) {
      return { success: false, error: 'Bu küpe numarası zaten kayıtlı.', message: '' }
    }

    let imageUrls: string[] = []
    for (const imageFile of validImages) {
      try {
        const blob = await put(`animals/${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`, imageFile, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        imageUrls.push(blob.url)
      } catch (uploadError) {
        console.error("Animal image upload error:", uploadError)
      }
    }

    // Geriye dönük uyumluluk için ilk fotoğrafı imageUrl olarak da kaydediyoruz
    const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : null

    await prisma.animal.create({
      data: {
        earTag,
        weight: weightRaw ? parseFloat(weightRaw) : null,
        groupName: groupName || null,
        imageUrl: firstImageUrl,
        imageUrls,
        note: note || null,
        order: isNaN(order) ? 0 : order,
      }
    })

    revalidatePath('/admin/animals')
    return { success: true, message: 'Hayvan başarıyla kaydedildi!', error: '' }
  } catch (error) {
    return { success: false, error: 'Hayvan kaydedilirken bir hata oluştu.', message: '' }
  }
}

export async function updateAnimal(prevState: any, formData: FormData) {
  try {
    const id = formData.get('id') as string
    const earTag = formData.get('earTag') as string
    const weightRaw = formData.get('weight') as string
    const groupName = formData.get('groupName') as string
    const note = formData.get('note') as string
    const imageFiles = formData.getAll('images') as File[]
    const validImages = imageFiles.filter(f => f && f.size > 0)
    const existingImagesRaw = formData.get('existingImages') as string
    let existingImages: string[] = []
    if (existingImagesRaw) {
       try {
           existingImages = JSON.parse(existingImagesRaw)
       } catch(e) {}
    }
    const orderRaw = formData.get('order') as string
    const order = orderRaw ? parseInt(orderRaw) : undefined

    if (!id || !earTag) {
      return { success: false, error: 'ID ve Küpe numarası zorunludur.', message: '' }
    }

    const animal = await prisma.animal.findUnique({ where: { id } })
    if (!animal) return { success: false, error: 'Hayvan bulunamadı.', message: '' }

    // Check earTag unique if changed
    if (earTag !== animal.earTag) {
      const existing = await prisma.animal.findUnique({ where: { earTag } })
      if (existing) {
        return { success: false, error: 'Bu küpe numarası zaten başka bir hayvana ait.', message: '' }
      }
    }

    let imageUrls: string[] = [...existingImages]
    for (const imageFile of validImages) {
      try {
        const blob = await put(`animals/${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`, imageFile, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        imageUrls.push(blob.url)
      } catch (uploadError) {
        console.error("Animal image update error:", uploadError)
      }
    }
    
    const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : null

    await prisma.animal.update({
      where: { id },
      data: {
        earTag,
        weight: weightRaw ? parseFloat(weightRaw) : null,
        groupName: groupName || null,
        imageUrl: firstImageUrl,
        imageUrls,
        note: note || null,
        order: order !== undefined && !isNaN(order) ? order : undefined,
      }
    })

    revalidatePath('/admin/animals')
    return { success: true, message: 'Hayvan başarıyla güncellendi!', error: '' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Hayvan güncellenirken bir hata oluştu.', message: '' }
  }
}

export async function deleteAnimals(ids: string[]) {
  try {
    await prisma.animal.deleteMany({
      where: {
        id: { in: ids }
      }
    })
    revalidatePath('/admin/animals')
    return { success: true, message: `${ids.length} hayvan silindi.`, error: '' }
  } catch (error) {
    return { success: false, error: 'Hayvanlar silinirken hata oluştu.', message: '' }
  }
}

export async function deleteAnimal(id: string) {
  try {
    await prisma.animal.delete({ where: { id } })
    revalidatePath('/admin/animals')
    return { success: true, message: 'Hayvan silindi.', error: '' }
  } catch (error) {
    return { success: false, error: 'Hayvan silinirken hata oluştu.', message: '' }
  }
}

export async function reorderAnimals(updates: { id: string, order: number }[]) {
  try {
    // Toplu güncelleme Prisma'da genellikle transaction ile yapılır
    await prisma.$transaction(
      updates.map(u => 
        prisma.animal.update({
          where: { id: u.id },
          data: { order: u.order }
        })
      )
    )
    revalidatePath('/admin/animals')
    return { success: true, message: 'Sıralama güncellendi.', error: '' }
  } catch (error) {
    console.error('Reorder error:', error)
    return { success: false, error: 'Sıralama kaydedilirken hata oluştu.', message: '' }
  }
}

export async function addShareholder(animalId: string, registrationId: string) {
  try {
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      include: {
        shareholders: {
          include: {
            registration: true
          }
        }
      }
    })
    
    if (!animal) {
      return { success: false, error: 'Hayvan bulunamadı.', message: '' }
    }

    const newReg = await prisma.registration.findUnique({
      where: { id: registrationId }
    })
    if (!newReg) {
      return { success: false, error: 'Hissedar kaydı bulunamadı.', message: '' }
    }

    const existingShares = animal.shareholders.reduce((sum, s) => sum + parseShareCount(s.registration?.share), 0)
    const newShares = parseShareCount(newReg.share)

    if (existingShares + newShares > 7) {
      return { success: false, error: `Bu işlemle toplam hisse sayısı ${existingShares + newShares} olacaktır. Bir hayvana en fazla 7 hisse eklenebilir (Mevcut: ${existingShares}, Eklenen: ${newShares}).`, message: '' }
    }

    // Check duplicate
    const exists = await prisma.animalShareholder.findUnique({
      where: { animalId_registrationId: { animalId, registrationId } }
    })
    if (exists) {
      return { success: false, error: 'Bu hissedar zaten ekli.', message: '' }
    }

    await prisma.animalShareholder.create({
      data: { animalId, registrationId }
    })

    revalidatePath('/admin/animals')
    return { success: true, message: 'Hissedar eklendi!', error: '' }
  } catch (error) {
    return { success: false, error: 'Hissedar eklenirken hata oluştu.', message: '' }
  }
}

export async function removeShareholder(shareholderId: string) {
  try {
    await prisma.animalShareholder.delete({ where: { id: shareholderId } })
    revalidatePath('/admin/animals')
    return { success: true, message: 'Hissedar kaldırıldı.', error: '' }
  } catch (error) {
    return { success: false, error: 'Hissedar kaldırılırken hata oluştu.', message: '' }
  }
}

export async function bulkImportAnimals(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'Dosya seçilmedi.', message: 'Dosya seçilmedi.' }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const row of data) {
      try {
        // Map common column names
        const earTag = (row['Küpe No'] || row['Küpe Numarası'] || row['Ear Tag'] || row['earTag'])?.toString()?.trim()
        const weight = parseFloat(row['Kilo'] || row['Ağırlık'] || row['Weight'] || row['weight'])
        const groupName = (row['Grup'] || row['Grup Adı'] || row['Group'] || row['group'])?.toString()?.trim()
        const note = (row['Not'] || row['Note'] || row['note'])?.toString()?.trim()

        if (!earTag) {
          errorCount++
          continue
        }

        const existing = await prisma.animal.findUnique({ where: { earTag } })
        if (existing) {
          skipCount++
          continue
        }

        await prisma.animal.create({
          data: {
            earTag,
            weight: isNaN(weight) ? null : weight,
            groupName: groupName || null,
            note: note || null
          }
        })
        successCount++
      } catch (e) {
        errorCount++
      }
    }

    revalidatePath('/admin/animals')
    return { 
      success: true, 
      message: `${successCount} hayvan başarıyla eklendi. ${skipCount} mükerrer atlandı. ${errorCount} hatalı satır.`,
      stats: { successCount, skipCount, errorCount }
    }
  } catch (error) {
    return { success: false, error: 'Dosya işlenirken bir hata oluştu.', message: 'Dosya işlenirken bir hata oluştu.' }
  }
}

export async function updateAnimalStatus(animalId: string, nextStatus: string) {
  try {
    await prisma.animal.update({
      where: { id: animalId },
      data: { deliveryStatus: nextStatus }
    })
    
    // Hayvan durumuna göre bağlı tüm kayıtları (hissedarları) da güncelle
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      include: { shareholders: true }
    })

    if (animal && animal.shareholders.length > 0) {
      const registrationIds = animal.shareholders.map(s => s.registrationId)
      await prisma.registration.updateMany({
        where: { id: { in: registrationIds } },
        data: { status: nextStatus }
      })
    }

    revalidatePath('/admin/animals')
    revalidatePath('/teslimat')
    revalidatePath('/')
    return { success: true, message: `Durum '${nextStatus}' olarak güncellendi.`, earTag: animal?.earTag }
  } catch (error) {
    return { success: false, error: 'Durum güncellenirken hata oluştu.' }
  }
}

export async function getAnimalsByStatus(status: string) {
  try {
    const animals = await prisma.animal.findMany({
      where: { deliveryStatus: status },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return { success: true, animals }
  } catch (error) {
    return { success: false, error: 'Hayvanlar çekilirken hata oluştu.' }
  }
}

export async function bulkUpdateAnimalStatus(animalIds: string[], nextStatus: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update animals
      await tx.animal.updateMany({
        where: { id: { in: animalIds } },
        data: { deliveryStatus: nextStatus }
      })

      // 2. Find all registration IDs associated with these animals
      const shareholders = await tx.animalShareholder.findMany({
        where: { animalId: { in: animalIds } }
      })
      const regIds = shareholders.map(s => s.registrationId)

      // 3. Update registrations
      if (regIds.length > 0) {
        await tx.registration.updateMany({
          where: { id: { in: regIds } },
          data: { status: nextStatus }
        })
      }
    })

    revalidatePath('/admin/animals')
    revalidatePath('/admin/tracking')
    revalidatePath('/teslimat')
    revalidatePath('/')
    return { success: true, message: 'Toplu durum güncellendi.' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Toplu güncelleme başarısız oldu.' }
  }
}

export async function createRegistrationAndAddAsShareholder(animalId: string, registrationData: {
  fullName: string
  phone: string
  address: string
  group: string
  share: string
}) {
  try {
    if (!animalId || !registrationData.fullName || !registrationData.phone || !registrationData.group) {
      return { success: false, error: 'Lütfen zorunlu alanları (Ad Soyad, Telefon, Grup) doldurunuz.', message: '' }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Kontenjan kontrolü
      const animal = await tx.animal.findUnique({
        where: { id: animalId },
        include: {
          shareholders: {
            include: {
              registration: true
            }
          }
        }
      })
      if (!animal) {
        throw new Error('Hayvan bulunamadı.')
      }

      const existingShares = animal.shareholders.reduce((sum, s) => sum + parseShareCount(s.registration?.share), 0)
      const newShares = parseShareCount(registrationData.share)

      if (existingShares + newShares > 7) {
        throw new Error(`Bu işlemle toplam hisse sayısı ${existingShares + newShares} olacaktır. Bir hayvana en fazla 7 hisse eklenebilir (Mevcut: ${existingShares}, Eklenen: ${newShares}).`)
      }

      // 2. Yeni hissedar kaydı oluştur
      const registration = await tx.registration.create({
        data: {
          fullName: registrationData.fullName,
          phone: registrationData.phone,
          address: registrationData.address || '',
          group: registrationData.group,
          share: registrationData.share || '',
          isDonation: false,
          status: 'ONAYLANDI'
        }
      })

      // 3. Hayvana bağla
      await tx.animalShareholder.create({
        data: {
          animalId,
          registrationId: registration.id
        }
      })
    })

    revalidatePath('/admin/animals')
    revalidatePath('/admin')
    return { success: true, message: 'Yeni hissedar başarıyla oluşturuldu ve hayvana eklendi!', error: '' }
  } catch (error: any) {
    console.error("Create registration and add shareholder error:", error)
    return { success: false, error: error.message || 'Hissedar eklenirken bir hata oluştu.', message: '' }
  }
}

