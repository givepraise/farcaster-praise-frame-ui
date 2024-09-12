import { NextResponse, NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    console.log('------------- ')
    console.log(request.headers)
    console.log('------------- ')
    // return NextResponse.redirect(new URL('/home', request.url))
    return NextResponse.next();
}

export const config = {
    matcher: '/api',
}