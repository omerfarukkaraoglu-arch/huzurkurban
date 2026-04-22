'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getFAQs() {
  try {
    return await prisma.faq.findMany({
      orderBy: { order: 'asc' }
    })
  } catch (error) {
    console.error('getFAQs error:', error)
    return []
  }
}

export async function createFAQ(prevState: any, formData: FormData) {
  const question = formData.get('question') as string
  const answer = formData.get('answer') as string
  const order = parseInt(formData.get('order') as string || '0')

  if (!question || !answer) {
    return { error: 'Soru ve cevap alanları zorunludur.' }
  }

  try {
    await prisma.faq.create({
      data: { question, answer, order }
    })
    revalidatePath('/admin/faqs')
    revalidatePath('/')
    return { success: true, message: 'Soru başarıyla eklendi.' }
  } catch (error) {
    console.error('createFAQ error:', error)
    return { error: 'Soru eklenirken bir hata oluştu.' }
  }
}

export async function updateFAQ(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const question = formData.get('question') as string
  const answer = formData.get('answer') as string
  const order = parseInt(formData.get('order') as string || '0')

  if (!id || !question || !answer) {
    return { error: 'Tüm alanlar zorunludur.' }
  }

  try {
    await prisma.faq.update({
      where: { id },
      data: { question, answer, order }
    })
    revalidatePath('/admin/faqs')
    revalidatePath('/')
    return { success: true, message: 'Soru başarıyla güncellendi.' }
  } catch (error) {
    console.error('updateFAQ error:', error)
    return { error: 'Soru güncellenirken bir hata oluştu.' }
  }
}

export async function deleteFAQ(id: string) {
  try {
    await prisma.faq.delete({ where: { id } })
    revalidatePath('/admin/faqs')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('deleteFAQ error:', error)
    return { error: 'Soru silinirken bir hata oluştu.' }
  }
}

export async function updateFAQOrder(id: string, newOrder: number) {
  try {
    await prisma.faq.update({
      where: { id },
      data: { order: newOrder }
    })
    revalidatePath('/admin/faqs')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('updateFAQOrder error:', error)
    return { error: 'Sıralama güncellenirken bir hata oluştu.' }
  }
}
