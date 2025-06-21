import jwt from "jsonwebtoken"

const secret = process.env.JWT_SECRET as string
if (!secret) {
  throw new Error("JWT_SECRET não definido no ambiente")
}

export interface SessionPayload {
  uid: string
}

export function signJwt(payload: SessionPayload): string {
  // 7 dias de expiração
  return jwt.sign(payload, secret, { expiresIn: "7d" })
}

export function verifyJwt(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, secret) as SessionPayload
  } catch {
    return null
  }
}
