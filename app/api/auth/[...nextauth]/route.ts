// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'

// Debug completo
const isDev = process.env.NODE_ENV === 'development'

if (isDev) {
  console.log('🔍 NextAuth Debug Mode')
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  })
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Authorize attempt:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
          timestamp: new Date().toISOString()
        })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          // Log da query
          console.log('📡 Querying Supabase for user:', credentials.email)
          
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single()

          if (error) {
            console.error('❌ Supabase query error:', {
              code: error.code,
              message: error.message,
              details: error.details
            })
            return null
          }

          if (!user) {
            console.log('❌ User not found in database')
            return null
          }

          console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            hasPassword: !!user.password
          })

          // Verificar senha
          console.log('🔑 Checking password...')
          const isValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValid) {
            console.log('❌ Invalid password')
            
            // Em dev, mostrar mais detalhes
            if (isDev) {
              const testHash = await bcrypt.hash(credentials.password, 10)
              console.log('Debug - Password check:', {
                providedPassword: credentials.password,
                storedHashFirst10: user.password.substring(0, 10),
                newHashFirst10: testHash.substring(0, 10),
                bcryptValidFormat: user.password.startsWith('$2')
              })
            }
            return null
          }

          console.log('✅ Password valid! Login successful')
          
          // Retornar dados do usuário
          const userData = {
            id: user.id,
            email: user.email,
            name: user.nome,
            role: user.role
          }
          
          console.log('✅ Returning user data:', userData)
          return userData
          
        } catch (error) {
          console.error('❌ Authorization error:', error)
          return null
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  
  callbacks: {
    async jwt({ token, user }) {
      console.log('🎫 JWT Callback:', {
        hasUser: !!user,
        hasToken: !!token,
        tokenId: token?.id
      })
      
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }
      return token
    },
    
    async session({ session, token }) {
      console.log('📦 Session Callback:', {
        hasSession: !!session,
        hasToken: !!token,
        tokenRole: token?.role
      })
      
      if (session?.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  
  debug: true, // Ativa todos os logs do NextAuth
  
  events: {
    async signIn(message) {
      console.log('✅ SignIn Event:', message)
    },
    async signOut(message) {
      console.log('👋 SignOut Event:', message)
    },
    async createUser(message) {
      console.log('👤 CreateUser Event:', message)
    },
    async session(message) {
      console.log('📦 Session Event:', message)
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }