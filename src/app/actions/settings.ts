'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { put } from '@vercel/blob'

export async function updateSettings(prevState: any, formData: FormData) {
  try {
    console.log("Settings update started...");
    const data: any = {
      siteTitle: (formData.get('siteTitle') as string) || 'Huzur Kurban',
      heroTitle: (formData.get('heroTitle') as string) || 'Kurbanınız Emin Ellerde',
      heroSubText: (formData.get('heroSubText') as string) || '',
      heroAccent: (formData.get('heroAccent') as string) || '',
      aboutTitle: (formData.get('aboutTitle') as string) || '',
      aboutText: (formData.get('aboutText') as string) || '',
      featuresTitle: (formData.get('featuresTitle') as string) || '',
      featuresSub: (formData.get('featuresSub') as string) || '',
      f1Title: (formData.get('f1Title') as string) || '',
      f1Text: (formData.get('f1Text') as string) || '',
      f2Title: (formData.get('f2Title') as string) || '',
      f2Text: (formData.get('f2Text') as string) || '',
      f3Title: (formData.get('f3Title') as string) || '',
      f3Text: (formData.get('f3Text') as string) || '',
      phone: (formData.get('phone') as string) || '',
      whatsapp: (formData.get('whatsapp') as string) || '',
      address: (formData.get('address') as string) || '',
    }

    const currentMenuConfig = formData.get('menuConfig') as string
    if (currentMenuConfig) {
      data.menuConfig = currentMenuConfig
    }

    const sliderFiles = formData.getAll('sliderImages') as File[]
    if (sliderFiles && sliderFiles.length > 0 && sliderFiles[0].size > 0) {
      console.log(`Processing ${sliderFiles.length} slider images...`);
      const paths: string[] = []
      for (const file of sliderFiles) {
        if (file.size > 0) {
          try {
            const blob = await put(`slider/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, file, {
              access: 'public',
              token: process.env.BLOB_READ_WRITE_TOKEN,
            })
            paths.push(blob.url)
            console.log("Uploaded blob:", blob.url);
          } catch (uploadError: any) {
            console.error("Blob upload error details:", uploadError);
            throw new Error(`Görsel yüklenemedi: ${uploadError.message || 'Blob hatası'}`);
          }
        }
      }
      if (paths.length > 0) {
        data.sliderImages = JSON.stringify(paths)
      }
    }

    console.log("Upserting settings to database...");
    await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: {
        id: 'singleton',
        ...data,
      }
    })

    try {
      console.log("Revalidating paths...");
      revalidatePath('/')
      revalidatePath('/admin/settings')
    } catch (revalidateError) {
      console.error("Revalidation notice (non-fatal):", revalidateError);
    }
    
    return { success: true, message: 'Ayarlar başarıyla güncellendi.', error: '' }
  } catch (error: any) {
    console.error("CRITICAL Settings update error:", error)
    return { success: false, error: `Sunucu Hatası: ${error.message || 'Bilinmeyen bir hata oluştu.'}`, message: '' }
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
