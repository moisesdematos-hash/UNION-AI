import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getSupabaseClient, isSupabaseConfigured } from './supabase-client.js';

/**
 * CLI Migration Tool: Copies data from local SQLite (data/union.db) to Supabase Cloud PostgreSQL.
 * Run with: npx tsx packages/server/src/db/migrate-to-supabase.ts
 */
async function migrateToSupabase() {
  console.log('====================================================');
  console.log('UNION.AI — Migrador de Dados SQLite -> Supabase Cloud');
  console.log('====================================================');

  if (!isSupabaseConfigured()) {
    console.error('❌ ERRO: Supabase não está configurado no arquivo .env!');
    console.error('Por favor, adicione as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no seu .env.');
    process.exit(1);
  }

  const supabase = getSupabaseClient()!;
  const localDbPath = path.resolve(process.env.DB_PATH || './data/union.db');

  if (!fs.existsSync(localDbPath)) {
    console.error(`❌ Arquivo SQLite local não encontrado em: ${localDbPath}`);
    process.exit(1);
  }

  console.log(`📂 Lendo banco SQLite local: ${localDbPath}`);
  const sqlite = new Database(localDbPath, { readonly: true });

  // Ordered list of tables respecting Foreign Key dependencies
  const tablesToMigrate = [
    'users',
    'organizations',
    'org_members',
    'org_invitations',
    'user_credits',
    'credit_transactions',
    'projects',
    'workflows',
    'workflow_nodes',
    'workflow_connections',
    'workflow_runs',
    'workflow_versions',
    'workflow_triggers',
    'execution_history',
    'audit_logs',
    'oracle_chat_sessions',
    'oracle_chat_messages',
    'oracle_chat_memories',
    'published_sales_pages',
    'password_reset_tokens',
    'processed_payments'
  ];

  let totalMigrated = 0;

  for (const tableName of tablesToMigrate) {
    try {
      const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all() as Record<string, any>[];
      if (rows.length === 0) {
        console.log(`  ⚪ [${tableName}] Vazia (0 registros).`);
        continue;
      }

      console.log(`  🚀 [${tableName}] Migrando ${rows.length} registros...`);

      // Upsert batch to Supabase
      const { error } = await supabase.from(tableName).upsert(rows);

      if (error) {
        console.error(`  ❌ Falha ao migrar [${tableName}]:`, error.message);
      } else {
        console.log(`  ✅ [${tableName}] ${rows.length} registros migrados com sucesso!`);
        totalMigrated += rows.length;
      }
    } catch (err: any) {
      console.warn(`  ⚠️ Aviso na tabela [${tableName}]: ${err.message}`);
    }
  }

  sqlite.close();
  console.log('====================================================');
  console.log(`🎉 Migração concluída! Total de registros migrados: ${totalMigrated}`);
  console.log('====================================================');
}

migrateToSupabase().catch((err) => {
  console.error('Erro crítico na migração:', err);
  process.exit(1);
});
