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
      // Novas tabelas do WhatsApp
      whatsapp_campaigns: {
        Row: {
          id: string
          name: string
          message_template: string
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_for: string | null
          sent_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          message_template: string
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_for?: string | null
        }
        Update: {
          name?: string
          message_template?: string
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_for?: string | null
          sent_at?: string | null
        }
      }
      whatsapp_messages: {
        Row: {
          id: string
          campaign_id: string | null
          recipient_number: string
          recipient_name: string | null
          message_body: string
          status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          error_message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          recipient_number: string
          recipient_name?: string | null
          message_body: string
          status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
        }
        Update: {
          status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error_message?: string | null
        }
      },
      whatsapp_incoming_messages: {
        Row: {
            id: string;
            from_number: string;
            message_body: string;
            received_at: string;
            consultant_id: string | null;
            campaign_id: string | null;
        };
        Insert: {
            id?: string;
            from_number: string;
            message_body: string;
            received_at?: string;
            consultant_id?: string | null;
            campaign_id?: string | null;
        };
        Update: {
            consultant_id?: string | null;
            campaign_id?: string | null;
        };
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
export type WhatsappCampaign = Tables<'whatsapp_campaigns'>
export type WhatsappMessage = Tables<'whatsapp_messages'>
export type WhatsappIncomingMessage = Tables<'whatsapp_incoming_messages'>;


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