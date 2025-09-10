// lib/auth.ts
import jwt from 'jsonwebtoken'
export type TokenPayload = { sub: string, role: 'ADMIN'|'TRIAGEM'|'PROMOTOR', email: string }
const SECRET = process.env.JWT_SECRET || 'dev-secret'
export function signAccess(payload: TokenPayload){ return jwt.sign(payload, SECRET, { expiresIn: '15m' }) }
export function verifyToken(token: string){ return jwt.verify(token, SECRET) as TokenPayload }
