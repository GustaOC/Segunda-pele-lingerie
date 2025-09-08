import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"
import { userOperations } from "@/lib/auth-data"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in data store
          const user = await userOperations.findUnique({
            email: credentials.email as string,
            ativo: true,
          })

          if (!user) {
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password as string, 
            user.hashSenha
          )

          if (!isValidPassword) {
            return null
          }

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.nome,
            role: user.role,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/admin/login",
  },
}

export default NextAuth(authOptions)