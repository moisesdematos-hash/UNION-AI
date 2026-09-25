import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Checks whether Supabase credentials are configured in the environment.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    env.SUPABASE_URL && 
    (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)
  );
}

/**
 * Returns the active Database Provider type.
 */
export function getActiveDatabaseProvider(): 'supabase' | 'sqlite' {
  if (env.NODE_ENV === 'test') {
    return 'sqlite'; // Always isolated in-memory SQLite for automated tests
  }
  return isSupabaseConfigured() ? 'supabase' : 'sqlite';
}

/**
 * Retrieves the singleton Supabase client.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = env.SUPABASE_URL!;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY!;

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return supabaseInstance;
}

/**
 * Performs a health-check and connection validation against Supabase.
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  provider: 'supabase' | 'sqlite';
  url?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      provider: 'sqlite',
      error: 'Supabase URL ou chaves não configuradas no ambiente (.env)'
    };
  }

  try {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Falha ao instanciar cliente Supabase');
    }

    // Ping the users table or query API status
    const { error } = await client.from('users').select('count', { count: 'exact', head: true });

    if (error) {
      // If table does not exist yet, connection worked but schema is needed
      if (error.code === '42P01' || error.message.includes('relation "users" does not exist')) {
        return {
          connected: true,
          provider: 'supabase',
          url: env.SUPABASE_URL,
          error: 'Conectado com sucesso, porém o schema ainda não foi criado. Execute o script SUPABASE_SCHEMA.sql no SQL Editor do Supabase.'
        };
      }
      throw error;
    }

    return {
      connected: true,
      provider: 'supabase',
      url: env.SUPABASE_URL
    };
  } catch (err: any) {
    return {
      connected: false,
      provider: 'supabase',
      url: env.SUPABASE_URL,
      error: err.message || 'Erro desconhecido ao conectar com o Supabase'
    };
  }
}
