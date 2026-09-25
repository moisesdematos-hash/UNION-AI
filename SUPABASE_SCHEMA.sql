-- ==============================================================================
-- UNION.AI — Supabase / PostgreSQL Complete Schema Migration
-- Compatible with Supabase PostgreSQL 15+
-- ==============================================================================

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Multi-Tenant Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id TEXT NOT NULL,
    credits_balance DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);

-- 3. Organization Members (RBAC)
CREATE TABLE IF NOT EXISTS org_members (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE(org_id, user_id),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);

-- 4. Organization Invitations
CREATE TABLE IF NOT EXISTS org_invitations (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON org_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON org_invitations(email);

-- 5. User Credits & Wallets
CREATE TABLE IF NOT EXISTS user_credits (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    balance DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    total_consumed DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id);

-- 6. Credit Transactions Audit Ledger
CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workflow_id TEXT,
    run_id TEXT,
    amount DOUBLE PRECISION NOT NULL,
    type TEXT NOT NULL, -- 'INITIAL_GRANT' | 'TOPUP' | 'CONSUMPTION' | 'REFUND'
    description TEXT,
    balance_after DOUBLE PRECISION NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);

-- 7. Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    org_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(org_id);

-- 8. Workflows (Canvas & DAG)
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    viewport_x DOUBLE PRECISION DEFAULT 0,
    viewport_y DOUBLE PRECISION DEFAULT 0,
    viewport_zoom DOUBLE PRECISION DEFAULT 1,
    groups_json TEXT NOT NULL DEFAULT '[]',
    version INTEGER NOT NULL DEFAULT 1,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflows_project ON workflows(project_id);

-- 9. Workflow Nodes
CREATE TABLE IF NOT EXISTS workflow_nodes (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    position_x DOUBLE PRECISION NOT NULL,
    position_y DOUBLE PRECISION NOT NULL,
    inputs_json TEXT NOT NULL DEFAULT '[]',
    outputs_json TEXT NOT NULL DEFAULT '[]',
    config_json TEXT NOT NULL DEFAULT '{}',
    state TEXT NOT NULL DEFAULT 'IDLE',
    execution_info_json TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow ON workflow_nodes(workflow_id);

-- 10. Workflow Connections (Edges)
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
    created_at BIGINT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (source_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_connections_workflow ON workflow_connections(workflow_id);

-- 11. Execution History (Node-level)
CREATE TABLE IF NOT EXISTS execution_history (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    node_id TEXT,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    tokens INTEGER,
    credits DOUBLE PRECISION,
    error TEXT,
    provider TEXT,
    model TEXT,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_execution_history_workflow ON execution_history(workflow_id);
CREATE INDEX IF NOT EXISTS idx_execution_history_user ON execution_history(user_id);

-- 12. Workflow Runs
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
    total_cost_credits DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    summary_json TEXT NOT NULL DEFAULT '{}',
    created_at BIGINT NOT NULL,
    completed_at BIGINT,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user ON workflow_runs(user_id);

-- 13. Workflow Versions (Snapshots)
CREATE TABLE IF NOT EXISTS workflow_versions (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    snapshot_json TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow ON workflow_versions(workflow_id);

-- 14. Workflow Triggers (Webhooks / Cron)
CREATE TABLE IF NOT EXISTS workflow_triggers (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    type TEXT NOT NULL,
    config_json TEXT NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow ON workflow_triggers(workflow_id);

-- 15. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    org_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details_json TEXT DEFAULT '{}',
    ip_address TEXT,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 16. Oracle AI Chat Sessions
CREATE TABLE IF NOT EXISTS oracle_chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    title TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_oracle_sessions_user ON oracle_chat_sessions(user_id);

-- 17. Oracle AI Chat Messages
CREATE TABLE IF NOT EXISTS oracle_chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
    content TEXT NOT NULL,
    applied_actions_json TEXT DEFAULT '[]',
    relevant_files_json TEXT DEFAULT '[]',
    suggested_follow_ups_json TEXT DEFAULT '[]',
    attachments_json TEXT DEFAULT '[]',
    created_at BIGINT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES oracle_chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_oracle_messages_session ON oracle_chat_messages(session_id, created_at ASC);

-- 18. Oracle AI Chat Memories (Persistent Context)
CREATE TABLE IF NOT EXISTS oracle_chat_memories (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES oracle_chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_oracle_memories_session ON oracle_chat_memories(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_oracle_memories_unique ON oracle_chat_memories(session_id, memory_key);

-- 19. Published Sales Pages (1-Click Landing Pages)
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

-- 20. Password Reset Tokens (Resend Email Recovery)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at BIGINT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);

-- 21. Processed Payments (Strict Idempotency for Stripe, PIX, Multicaixa & PayPay)
CREATE TABLE IF NOT EXISTS processed_payments (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_payment_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    package_id TEXT NOT NULL,
    amount_paid DOUBLE PRECISION NOT NULL,
    credits_amount DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL,
    metadata_json TEXT DEFAULT '{}',
    created_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_processed_payments_provider_id ON processed_payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_processed_payments_user ON processed_payments(user_id);
