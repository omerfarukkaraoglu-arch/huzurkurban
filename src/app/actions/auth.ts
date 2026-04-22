'use server'

import { prisma } from '@/lib/prisma'
import { login, logout } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Kullanıcı adı ve şifre zorunludur.' }
  }

  // Ensure at least one user exists
  await initSuperAdmin()

  try {
    const user = await prisma.user.findUnique({ where: { username } })

    if (!user) {
      return { error: 'Hatalı kullanıcı adı veya şifre.' }
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return { error: 'Hatalı kullanıcı adı veya şifre.' }
    }

    await login({
      id: user.id,
      username: user.username,
      role: user.role
    })

  } catch (error) {
    console.error('Login error:', error)
    return { error: 'Giriş yapılırken bir hata oluştu.' }
  }

  redirect('/admin')
}

export async function logoutAction() {
  await logout()
  redirect('/admin/login')
}

// Helper to initialize a superadmin if no users exist
export async function initSuperAdmin() {
  try {
    const userCount = await prisma.user.count()
    if (userCount === 0) {
      const passwordHash = await bcrypt.hash('huzur123', 10)
      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          fullName: 'Süper Admin',
          role: 'SUPERADMIN'
        }
      })
      console.log('Default superadmin created: admin / huzur123')
    }
  } catch (error) {
    console.error('Init superadmin error:', error)
  }
}
