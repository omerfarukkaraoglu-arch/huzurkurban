'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { put } from '@vercel/blob'

export async function updateSettings(prevState: any, formData: FormData) {
  try {
    const data: any = {
      siteTitle: formData.get('siteTitle') as string,
      heroText: formData.get('heroText') as string,
      phone: formData.get('phone') as string,
      whatsapp: formData.get('whatsapp') as string,
      menuConfig: formData.get('menuConfig') as string,
      address: formData.get('address') as string,
    }

    const sliderFiles = formData.getAll('sliderImages') as File[]
    if (sliderFiles && sliderFiles.length > 0 && sliderFiles[0].size > 0) {
      const paths: string[] = []
      for (const file of sliderFiles) {
        if (file.size > 0) {
          const blob = await put(`slider/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, file, {
            access: 'public',
          })
          paths.push(blob.url)
        }
      }
      if (paths.length > 0) {
        data.sliderImages = JSON.stringify(paths)
      }
    }

    await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: {
        id: 'singleton',
        ...data,
      }
    })

    revalidatePath('/')
    revalidatePath('/admin/settings')
    
    return { success: true, message: 'Ayarlar başarıyla güncellendi.', error: '' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Ayarlar güncellenirken bir hata oluştu.', message: '' }
  }
}

export async function createGroup(prevState: any, formData: FormData) {
  try {
    const name = formData.get('name') as string
    const price = formData.get('price') as string
    const isDonation = formData.get('isDonation') === 'on'

    const maxSlotsRaw = formData.get('maxSlots') as string
    const maxSlots = maxSlotsRaw && parseInt(maxSlotsRaw) > 0 ? parseInt(maxSlotsRaw) : null

    if (!name || !price) {
      return { success: false, error: 'Grup adı ve fiyatı zorunludur.', message: '' }
    }

    await prisma.kurbanGroup.create({
      data: { name, price, isDonation, maxSlots }
    })

    revalidatePath('/')
    revalidatePath('/admin/settings')
    return { success: true, message: 'Grup başarıyla eklendi!', error: '' }
  } catch (error) {
    return { success: false, error: 'Grup eklenirken bir hata oluştu.', message: '' }
  }
}

export async function deleteGroup(id: string) {
  try {
    await prisma.kurbanGroup.delete({ where: { id } })
    revalidatePath('/')
    revalidatePath('/admin/settings')
    return { success: true, message: 'Grup başarıyla silindi!', error: '' }
  } catch (error) {
    return { success: false, error: 'Grup silinirken bir hata oluştu.', message: '' }
  }
}

export async function toggleGroupStatus(id: string) {
  try {
    const group = await prisma.kurbanGroup.findUnique({ where: { id } })
    if (!group) return { success: false, error: 'Grup bulunamadı.', message: '' }

    await prisma.kurbanGroup.update({
      where: { id },
      data: { isActive: !group.isActive }
    })

    revalidatePath('/')
    revalidatePath('/admin/settings')
    return { success: true, message: group.isActive ? 'Kayıtlar durduruldu!' : 'Kayıtlar açıldı!', error: '' }
  } catch (error) {
    return { success: false, error: 'Durum değiştirilirken hata oluştu.', message: '' }
  }
}
