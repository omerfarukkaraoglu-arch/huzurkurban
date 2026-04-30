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
  const station = formData.get('station') as string

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
        station
      }
    })

    revalidatePath('/admin/users')
    return { success: true, message: 'Kullanıcı başarıyla oluşturuldu.' }
  } catch (error) {
    return { error: 'Kullanıcı oluşturulurken bir hata oluştu.' }
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
