import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const cookies = req.cookies.getAll()
    const authToken = req.cookies.get("auth_token")?.value
    const authTokenExists = req.cookies.get("auth_token_exists")?.value
    
    return NextResponse.json({
        timestamp: new Date().toISOString(),
        cookies: cookies.map(c => ({ name: c.name, valueLength: c.value?.length || 0 })),
        hasAuthToken: !!authToken,
        authTokenLength: authToken?.length || 0,
        authTokenExists: authTokenExists,
        headers: {
            host: req.headers.get("host"),
            origin: req.headers.get("origin"),
            referer: req.headers.get("referer"),
            cookie: req.headers.get("cookie")?.substring(0, 100) + "..." // First 100 chars
        }
    })
}
