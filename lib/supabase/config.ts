// lib/supabase/config.ts
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  
  // Configurações de autenticação consistentes
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  },
  
  // Configurações de cookies para SSR
  cookies: {
    name: 'sb-auth-token',
    lifetime: 60 * 60 * 24 * 7, // 7 dias
    domain: undefined,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  },
  
  // Configurações de rede
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  
  // Headers globais
  global: {
    headers: {
      'X-Client-Info': 'segunda-pele-admin',
    },
  },
} as const

// Validação de ambiente
if (!supabaseConfig.url) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL não está definida')
}

if (!supabaseConfig.anonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida')
}

export default supabaseConfig