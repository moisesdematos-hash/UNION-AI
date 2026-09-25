import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

let dbInstance: Database.Database | null = null;

export function getDatabase(customPath?: string): Database.Database {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const isVercel = Boolean(process.env.VERCEL);
  const defaultPath = isVercel ? '/tmp/union.db' : env.DB_PATH;
  const targetPath = customPath || (env.NODE_ENV === 'test' ? ':memory:' : defaultPath);

  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.warn('[Database] Could not create directory, falling back to memory:', err);
        return new Database(':memory:');
      }
    }
  }

  const db = new Database(targetPath);

  // Enable WAL mode for high concurrency in file mode
  if (targetPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');

  // Initialize Schema Migrations
  initializeSchema(db);

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function resetTestDatabase(): void {
  const db = getDatabase();
  db.prepare('DELETE FROM password_reset_tokens').run();
  db.prepare('DELETE FROM processed_payments').run();
  db.prepare('DELETE FROM published_sales_pages').run();
  db.prepare('DELETE FROM audit_logs').run();
  db.prepare('DELETE FROM org_invitations').run();
  db.prepare('DELETE FROM org_members').run();
  db.prepare('DELETE FROM workflow_triggers').run();
  db.prepare('DELETE FROM workflow_connections').run();
  db.prepare('DELETE FROM workflow_nodes').run();
  db.prepare('DELETE FROM workflow_versions').run();
  db.prepare('DELETE FROM workflow_runs').run();
  db.prepare('DELETE FROM execution_history').run();
  db.prepare('DELETE FROM workflows').run();
  db.prepare('DELETE FROM projects').run();
  db.prepare('DELETE FROM organizations').run();
  db.prepare('DELETE FROM credit_transactions').run();
  db.prepare('DELETE FROM user_credits').run();
  db.prepare('DELETE FROM users').run();
  db.prepare('DELETE FROM oracle_chat_memories').run();
  db.prepare('DELETE FROM oracle_chat_messages').run();
  db.prepare('DELETE FROM oracle_chat_sessions').run();
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      credits_balance REAL NOT NULL DEFAULT 100.0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS org_members (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(org_id, user_id),
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS org_invitations (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);

    CREATE TABLE IF NOT EXISTS user_credits (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      balance REAL NOT NULL DEFAULT 100.0,
      total_consumed REAL NOT NULL DEFAULT 0.0,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      workflow_id TEXT,
      run_id TEXT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      balance_after REAL NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      org_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      viewport_x REAL DEFAULT 0,
      viewport_y REAL DEFAULT 0,
      viewport_zoom REAL DEFAULT 1,
      groups_json TEXT NOT NULL DEFAULT '[]',
      version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workflow_nodes (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      inputs_json TEXT NOT NULL DEFAULT '[]',
      outputs_json TEXT NOT NULL DEFAULT '[]',
      config_json TEXT NOT NULL DEFAULT '{}',
      state TEXT NOT NULL DEFAULT 'IDLE',
      execution_info_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workflow_connections (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      source_node_id TEXT NOT NULL,
      source_port_id TEXT NOT NULL,
      target_node_id TEXT NOT NULL,
      target_port_id TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'connected',
      last_packet_json TEXT,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (source_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS execution_history (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      node_id TEXT,
      status TEXT NOT NULL,
      duration_ms INTEGER,
      tokens INTEGER,
      credits REAL,
      error TEXT,
      provider TEXT,
      model TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'RUN',
      total_nodes INTEGER NOT NULL DEFAULT 0,
      completed_nodes INTEGER NOT NULL DEFAULT 0,
      failed_nodes INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      total_cost_credits REAL NOT NULL DEFAULT 0.0,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      summary_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workflow_versions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      snapshot_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workflow_triggers (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      secret_token TEXT,
      config_json TEXT NOT NULL DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      last_triggered_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow ON workflow_triggers(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_triggers_token ON workflow_triggers(secret_token);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

    CREATE TABLE IF NOT EXISTS oracle_chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS oracle_chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      category TEXT,
      relevant_files_json TEXT DEFAULT '[]',
      suggested_follow_ups_json TEXT DEFAULT '[]',
      attachments_json TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES oracle_chat_sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_oracle_messages_session ON oracle_chat_messages(session_id, created_at ASC);

    CREATE TABLE IF NOT EXISTS oracle_chat_memories (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      memory_key TEXT NOT NULL,
      memory_value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES oracle_chat_sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_oracle_memories_session ON oracle_chat_memories(session_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_oracle_memories_unique ON oracle_chat_memories(session_id, memory_key);

    CREATE TABLE IF NOT EXISTS published_sales_pages (
      slug TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      copy_json TEXT NOT NULL,
      html TEXT NOT NULL,
      checkout_url TEXT NOT NULL,
      published_at TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_published_sales_pages_user ON published_sales_pages(user_id);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);

    CREATE TABLE IF NOT EXISTS processed_payments (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_payment_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      amount_paid REAL NOT NULL,
      credits_amount REAL NOT NULL,
      status TEXT NOT NULL,
      metadata_json TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_processed_payments_provider_id ON processed_payments(provider_payment_id);
    CREATE INDEX IF NOT EXISTS idx_processed_payments_user ON processed_payments(user_id);
  `);

  try {
    db.exec(`ALTER TABLE workflows ADD COLUMN groups_json TEXT NOT NULL DEFAULT '[]'`);
  } catch {
    // Column already exists
  }
}
