'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

export async function createUser(prevState: any, formData: FormData) {
  const session = await getSession()
  if (session?.user?.role !== 'SUPERADMIN') {
    return { error: 'Bu işlem için yetkiniz yok.' }
  }

  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string
  const stationId = formData.get('stationId') as string

  if (!username || !password || !role) {
    return { error: 'Lütfen tüm zorunlu alanları doldurun.' }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) return { error: 'Bu kullanıcı adı zaten alınmış.' }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        username,
        passwordHash,
        fullName,
        role,
        stationId: stationId || null
      }
    })

    revalidatePath('/admin/users')
    return { success: true, message: 'Kullanıcı başarıyla oluşturuldu.' }
  } catch (error) {
    return { error: 'Kullanıcı oluşturulurken bir hata oluştu.' }
  }
}

export async function updateUser(prevState: any, formData: FormData) {
  const session = await getSession()
  if (session?.user?.role !== 'SUPERADMIN') {
    return { error: 'Bu işlem için yetkiniz yok.' }
  }

  const id = formData.get('id') as string
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string
  const stationId = formData.get('stationId') as string

  if (!id || !username || !role) {
    return { error: 'Lütfen tüm zorunlu alanları doldurun.' }
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { 
        username,
        NOT: { id }
      }
    })
    if (existing) return { error: 'Bu kullanıcı adı zaten başka bir kullanıcı tarafından kullanılıyor.' }

    const updateData: any = {
      username,
      fullName,
      role,
      stationId: stationId || null
    }

    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 10)
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    })

    revalidatePath('/admin/users')
    return { success: true, message: 'Kullanıcı başarıyla güncellendi.' }
  } catch (error) {
    console.error('Update user error:', error)
    return { error: 'Kullanıcı güncellenirken bir hata oluştu.' }
  }
}

export async function deleteUser(id: string) {
  const session = await getSession()
  if (session?.user?.role !== 'SUPERADMIN') {
    return { error: 'Bu işlem için yetkiniz yok.' }
  }

  // Don't delete self
  if (session.user.id === id) {
    return { error: 'Kendi hesabınızı silemezsiniz.' }
  }

  try {
    await prisma.user.delete({ where: { id } })
    revalidatePath('/admin/users')
    return { success: true, message: 'Kullanıcı silindi.' }
  } catch (error) {
    return { error: 'Kullanıcı silinirken bir hata oluştu.' }
  }
}
