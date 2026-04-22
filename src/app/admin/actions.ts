'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: { error: string } | null, formData: FormData) {
  const password = formData.get('password')
  const envPassword = process.env.ADMIN_PASSWORD || 'huzur123'
  
  if (password === envPassword) {
    const cookieStore = await cookies()
    cookieStore.set('huzur_admin_session', 'true', { 
      secure: process.env.NODE_ENV === 'production', 
      httpOnly: true,
      path: '/'
    })
  } else {
    return { error: 'Geçersiz şifre!' }
  }
  
  redirect('/admin')
}
