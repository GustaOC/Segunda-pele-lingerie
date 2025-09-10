// lib/next-auth.ts
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const getAuthSession = () => {
  return getServerSession(authOptions)
}