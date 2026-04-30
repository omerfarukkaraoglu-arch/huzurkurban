'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { put } from '@vercel/blob'
import * as XLSX from 'xlsx'

export async function createAnimal(prevState: any, formData: FormData) {
  try {
    const earTag = formData.get('earTag') as string
    const weightRaw = formData.get('weight') as string
    const groupName = formData.get('groupName') as string
    const note = formData.get('note') as string
    const imageFiles = formData.getAll('images') as File[]
    const validImages = imageFiles.filter(f => f && f.size > 0)

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
    // Check max 7
    const count = await prisma.animalShareholder.count({ where: { animalId } })
    if (count >= 7) {
      return { success: false, error: 'Bu hayvana en fazla 7 hissedar eklenebilir.', message: '' }
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
      orderBy: { updatedAt: 'desc' },
      take: 20
    })
    return { success: true, animals }
  } catch (error) {
    return { success: false, error: 'Hayvanlar çekilirken hata oluştu.' }
  }
}
