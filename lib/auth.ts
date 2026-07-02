import { SignJWT, jwtVerify } from 'jose'

export const AUTH_COOKIE = 'auth_token'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export interface AuthUser {
  id: string
  email: string
}

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { id: payload.sub as string, email: payload.email as string }
  } catch {
    return null
  }
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}
