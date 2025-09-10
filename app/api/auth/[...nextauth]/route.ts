import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { supabase } from "@/lib/supabase-client"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Por favor, preencha todos os campos.")
        }

        // Buscar usuário no Supabase
        const { data: user, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("email", credentials.email)
          .single()

        if (error || !user) {
          throw new Error("Usuário não encontrado.")
        }

        // Verificar se o usuário está ativo
        if (!user.ativo) {
          throw new Error("Usuário desativado. Contate o administrador.")
        }

        // Comparar senha usando bcrypt
        const senhaCorreta = await bcrypt.compare(credentials.password, user.password)
        if (!senhaCorreta) {
          throw new Error("Credenciais inválidas.")
        }

        // Retornar usuário autorizado
        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
