import { NextRequest, NextResponse } from 'next/server'

// Mark this route as dynamic since it uses request headers
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get the client's IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1'

    // Use a free IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${clientIp}?fields=timezone`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch timezone data')
    }

    const data = await response.json()
    
    if (data.status === 'fail') {
      // Fallback to browser timezone if IP detection fails
      return NextResponse.json({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        detected: false,
        fallback: true
      })
    }

    return NextResponse.json({
      timezone: data.timezone,
      detected: true,
      fallback: false
    })
  } catch (error) {
    console.error('Error detecting timezone:', error)
    
    // Fallback to browser timezone
    return NextResponse.json({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      detected: false,
      fallback: true,
      error: 'Failed to detect timezone from IP'
    })
  }
}
