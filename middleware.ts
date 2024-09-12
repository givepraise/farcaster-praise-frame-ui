import { NextResponse, NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    console.log('------------- ')
    console.log(request)
    console.log('------------- ')
    const bots = [
        'TwitterBot',
        'python-requests',
        'aiohttp',
        'Go-http-client',
        'axios',
        'facebookexternalhit',
        'node-fetch',
        'FCBot',
        'probe-image-size']
    const userAgent = request.headers.get('user-agent') || ''
    const isBot = bots.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()))
    const referer = request.headers.get('referer')
    const isOpenedOnBrowser = referer && referer.indexOf('warpcast') > -1
    if (!isBot && isOpenedOnBrowser) {
        return NextResponse.redirect('https://givepraise.xyz/')
    }
    return NextResponse.next();
}

export const config = {
    matcher: '/api',
}
