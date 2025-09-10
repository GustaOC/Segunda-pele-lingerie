// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Login attempt for:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing email or password')
          return null
        }

        try {
          // Buscar usuário no Supabase
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, email, nome, password, role, ativo')
            .eq('email', credentials.email)
            .eq('ativo', true) // Só usuários ativos
            .single()

          if (error || !user) {
            console.log('❌ User not found or inactive:', credentials.email)
            return null
          }

          // Verificar se a senha existe
          if (!user.password) {
            console.log('❌ No password set for user:', credentials.email)
            return null
          }

          // Verificar senha
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValidPassword) {
            console.log('❌ Invalid password for:', credentials.email)
            return null
          }

          console.log('✅ Login successful for:', credentials.email)
          
          return {
            id: user.id,
            email: user.email,
            name: user.nome,
            role: user.role
          }
          
        } catch (error) {
          console.error('❌ Authentication error:', error)
          return null
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }
      return token
    },
    
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  
  // Remover debug em produção
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }