import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/pricing', '/api/webhooks/stripe']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname === p) || pathname.startsWith('/api/stripe')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('sb-abnwdqiiampqvucraydz-auth-token')?.value
    ?? request.cookies.get('sb-access-token')?.value

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
