// lib/supabase-auth.ts
import { supabaseAdmin } from './supabase-server'

// Operações reais com Supabase
export const userOperations = {
  findUnique: async (where: { email: string; ativo?: boolean }) => {
    const query = supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', where.email)
    
    if (where.ativo !== undefined) {
      query.eq('ativo', where.ativo)
    }
    
    const { data, error } = await query.single()
    
    if (error || !data) return null
    return data
  },

  create: async (data: {
    nome: string
    email: string
    hashSenha: string  // Mantendo hashSenha para compatibilidade
    role: string
    ativo: boolean
  }) => {
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        nome: data.nome,
        email: data.email,
        password: data.hashSenha,  // Salvando hashSenha como password
        role: data.role,
        ativo: data.ativo
      })
      .select()
      .single()
    
    if (error) throw error
    return newUser
  },

  findMany: async () => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}