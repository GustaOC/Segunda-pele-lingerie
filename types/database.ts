// types/database.ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string | null
          role: string | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
          telefone: string | null
        }
        Insert: {
          id: string
          nome?: string | null
          role?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          telefone?: string | null
        }
        Update: {
          id?: string
          nome?: string | null
          role?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          telefone?: string | null
        }
      }
      users: {
        Row: {
          id: string
          nome: string
          email: string
          password: string
          role: string
          ativo: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          password: string
          role?: string
          ativo?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          password?: string
          role?: string
          ativo?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'ADMIN' | 'USER' | 'CONSULTANT'
    }
  }
}

// Tipos auxiliares
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Tipos específicos
export type Profile = Tables<'profiles'>
export type User = Tables<'users'>
export type UserRole = Database['public']['Enums']['user_role']

// Tipos de autenticação
export interface AuthResponse {
  user: User | null
  session: any | null
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  nome: string
  email: string
  password: string
  role?: UserRole
}