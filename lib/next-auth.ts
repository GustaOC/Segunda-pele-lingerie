import { getServerSession } from "next-auth/next"
import { authOptions } from "@/auth"

export const getAuthSession = () => {
  return getServerSession(authOptions)
}