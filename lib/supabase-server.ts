// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente server-side (privado). Use a SUPABASE_SERVICE_ROLE_KEY aqui.
 * Este arquivo **deve** rodar em runtime nodejs (server) para manter a key segura.
 */
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL env var');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var (service role)');
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }, // server-side, não persiste sesssão
  }
);
