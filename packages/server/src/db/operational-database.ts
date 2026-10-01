import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool, PoolClient, types } from 'pg';
import { env } from '../config/env.js';
// Application timestamps and counts fit JS safe integers. Never silently round a bigint.
types.setTypeParser(20, value => {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed))
        throw new Error('Unsafe PostgreSQL bigint');
    return parsed;
});
let pool: Pool | undefined;
let injectedPool: Pool | undefined;
const context = new AsyncLocalStorage<{
    client?: PoolClient;
    sqlite?: true;
}>();
let localTail: Promise<unknown> = Promise.resolve();
export function databaseProvider(): 'postgres' | 'sqlite' {
    return injectedPool ? 'postgres' : env.NODE_ENV === 'test' ? 'sqlite' : env.DATABASE_URL ? 'postgres' : 'sqlite';
}
export function injectPostgresForTests(value?: Pool): void {
    if (env.NODE_ENV !== 'test')
        throw new Error('Test injection forbidden outside test');
    injectedPool = value;
}
function getPool(): Pool {
    if (injectedPool)
        return injectedPool;
    if (!env.DATABASE_URL)
        throw new Error('DATABASE_URL is required for PostgreSQL/Supabase');
    pool ??= new Pool({ connectionString: env.DATABASE_URL, max: env.DB_POOL_MAX,
        connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000,
        statement_timeout: 15000,
        ssl: env.DB_SSL === 'require' ? { rejectUnauthorized: true } : undefined });
    return pool;
}
export function postgresSql(sql: string): string {
    // Convert positional placeholders outside quoted literals/comments.
    let index = 0;
    return sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\n]*|\/\*[\s\S]*?\*\/|\?/g, token => token === '?' ? `$${++index}` : token)
        .replace(/\bAS\s+([a-zA-Z_]\w*)/gi, (_match, alias) => `AS "${alias}"`);
}
async function locally<T>(fn: () => Promise<T>): Promise<T> {
    if (context.getStore()?.sqlite)
        return fn();
    const next = localTail.then(() => context.run({ sqlite: true }, fn));
    localTail = next.catch(() => undefined);
    return next;
}
async function query(sql: string, params: unknown[] = []) {
    if (databaseProvider() === 'postgres') {
        const client = context.getStore()?.client || getPool();
        const result = await client.query(postgresSql(sql), params);
        return { rows: result.rows, changes: result.rowCount || 0 };
    }
    if (env.NODE_ENV === 'production' || process.env.VERCEL) {
        throw new Error('DATABASE_URL is required; SQLite is disabled in production');
    }
    return (await locally(async () => {
        const { getDatabase } = await import('./database.js');
        const statement = getDatabase().prepare(sql);
        if (/^\s*(SELECT|WITH|PRAGMA)\b/i.test(sql))
            return { rows: statement.all(...params), changes: 0 };
        return { rows: [], changes: statement.run(...params).changes };
    }));
}
export const operationalDatabase = {
    async exec(sql: string): Promise<void> {
        if (databaseProvider() === 'postgres') {
            await (context.getStore()?.client || getPool()).query(sql);
        }
        else {
            if (env.NODE_ENV === 'production' || process.env.VERCEL)
                throw new Error('SQLite disabled');
            await locally(async () => { const { getDatabase } = await import('./database.js'); getDatabase().exec(sql); });
        }
    },
    prepare(sql: string) {
        return {
            async get(...params: unknown[]): Promise<any> { return (await query(sql, params)).rows[0]; },
            async all(...params: unknown[]): Promise<any[]> { return (await query(sql, params)).rows; },
            async run(...params: unknown[]) { return { changes: (await query(sql, params)).changes }; }
        };
    },
    transaction<T>(fn: () => Promise<T> | T): () => Promise<T> {
        return async () => {
            if (context.getStore())
                return fn(); // Nested service calls share the same transaction.
            if (databaseProvider() === 'postgres') {
                const client = await getPool().connect();
                try {
                    await client.query('BEGIN');
                    const result = await context.run({ client }, fn);
                    await client.query('COMMIT');
                    return result;
                }
                catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                }
                finally {
                    client.release();
                }
            }
            return (await locally(async () => {
                const { getDatabase } = await import('./database.js');
                const db = getDatabase();
                db.exec('BEGIN IMMEDIATE');
                try {
                    const result = await fn();
                    db.exec('COMMIT');
                    return result;
                }
                catch (error) {
                    db.exec('ROLLBACK');
                    throw error;
                }
            }));
        };
    },
    async lock(key: string): Promise<void> {
        if (databaseProvider() === 'postgres') {
            if (!context.getStore()?.client)
                throw new Error('Lock requires transaction');
            await context.getStore()!.client!.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
        }
    }
};
export function getOperationalDatabase() { return operationalDatabase; }
export async function closeOperationalDatabase() { await pool?.end(); pool = undefined; }
