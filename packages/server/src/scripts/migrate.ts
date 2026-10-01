import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getOperationalDatabase, closeOperationalDatabase, databaseProvider } from '../db/operational-database.js';
if (databaseProvider() !== 'postgres')
    throw new Error('Configure DATABASE_URL para aplicar migrações PostgreSQL');
const db = getOperationalDatabase();
const sql = await readFile(new URL('../../../../supabase/schema.sql', import.meta.url), 'utf8');
const digest = createHash('sha256').update(sql).digest('hex');
try {
    await db.transaction(async () => {
        await db.lock('schema-migrations');
        await db.exec('CREATE TABLE IF NOT EXISTS _schema_migrations (id TEXT PRIMARY KEY, name TEXT NOT NULL, applied_at BIGINT NOT NULL)');
        if (!await db.prepare('SELECT id FROM _schema_migrations WHERE id = ?').get(digest)) {
            await db.exec(sql);
            await db.prepare('INSERT INTO _schema_migrations (id, name, applied_at) VALUES (?, ?, ?)').run(digest, 'canonical schema', Date.now());
        }
    })();
    console.log('Migração concluída');
}
finally {
    await closeOperationalDatabase();
}
