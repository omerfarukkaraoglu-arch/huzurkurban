'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

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

export async function bulkImportRegistrations(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const isDonation = formData.get('isDonation') === 'true'
    
    if (!file) return { success: false, error: 'Dosya seçilmedi.', message: 'Dosya seçilmedi.' }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]

    let successCount = 0
    let errorCount = 0

    for (const row of data) {
      try {
        const fullName = (row['Ad Soyad'] || row['Ad'] || row['Full Name'] || row['fullName'])?.toString()?.trim()
        const phone = (row['Telefon'] || row['GSM'] || row['Phone'] || row['phone'])?.toString()?.trim()
        const address = (row['Adres'] || row['Address'] || row['address'])?.toString()?.trim() || ''
        const group = (row['Grup'] || row['Bağış Türü'] || row['Group'] || row['group'])?.toString()?.trim()
        const share = (row['Hisse'] || row['Not'] || row['Share'] || row['share'] || row['note'])?.toString()?.trim() || ''

        if (!fullName || !phone || !group) {
          errorCount++
          continue
        }

        await prisma.registration.create({
          data: {
            fullName,
            phone,
            address,
            group,
            share,
            isDonation,
            status: 'BEKLEMEDE'
          }
        })
        successCount++
      } catch (e) {
        errorCount++
      }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/donations')
    
    return { 
      success: true, 
      message: `${successCount} kayıt başarıyla eklendi. ${errorCount} hatalı satır atlandı.`,
      stats: { successCount, errorCount }
    }
  } catch (error) {
    console.error('Bulk import error:', error)
    return { success: false, error: 'Dosya işlenirken bir hata oluştu.', message: 'Dosya işlenirken bir hata oluştu.' }
  }
}

export async function updateRegistration(formData: FormData) {
  try {
    const id = formData.get('id') as string
    const data = {
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      group: formData.get('group') as string,
      share: formData.get('share') as string,
      status: formData.get('status') as string,
    }

    if (!id || !data.fullName || !data.phone || !data.group) {
      return { success: false, error: 'Lütfen zorunlu alanları doldurunuz.' }
    }

    await prisma.registration.update({
      where: { id },
      data,
    })

    revalidatePath('/admin')
    revalidatePath('/admin/donations')
    
    return { success: true, message: 'Kayıt başarıyla güncellendi.' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Güncelleme sırasında bir hata oluştu.' }
  }
}
