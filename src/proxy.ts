import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from './lib/session'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public paths
  const isPublicPath = path === '/admin/login' || path === '/' || !path.startsWith('/admin')

  const session = request.cookies.get('session')?.value

  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (session) {
    try {
      const payload = await decrypt(session)
      
      // If logged in and trying to access login page, redirect to admin
      if (path === '/admin/login') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      // Role-based access control
      const role = payload.user?.role
      
      // Only SUPERADMIN can access users and settings
      if ((path.startsWith('/admin/users') || path.startsWith('/admin/settings')) && role !== 'SUPERADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

    } catch (error) {
       // Invalid session
       if (!isPublicPath) {
         return NextResponse.redirect(new URL('/admin/login', request.url))
       }
    }
  }

  return NextResponse.next()
}

// Routes Proxy should run on
export const config = {
  matcher: ['/admin/:path*'],
}
