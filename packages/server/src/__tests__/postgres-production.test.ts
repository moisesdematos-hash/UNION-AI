import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import type { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import request from 'supertest';
import { injectPostgresForTests, getOperationalDatabase } from '../db/operational-database.js';
import { createApp } from '../app.js';
import { creditsService } from '../services/credits-service.js';
import { authService } from '../services/auth.js';
import { userStorageService } from '../services/user-storage-service.js';
import { checkDatabaseReadiness } from '../db/readiness.js';
import { WorkflowJobs } from '../services/workflow-jobs.js';

const pg = new PGlite();
const app = createApp();
let tail: Promise<void> = Promise.resolve();
async function query(sql: string, params?: unknown[]) {
    if (!params && sql.includes(';')) {
        const results = await pg.exec(sql);
        const result = results[results.length - 1];
        return { rows: result?.rows || [], rowCount: result?.affectedRows || 0 };
    }
    const result = await pg.query(sql, params || []);
    return { rows: result.rows, rowCount: result.affectedRows || 0 };
}
const pool = {
    query,
    async connect() {
        const previous = tail;
        let unlock!: () => void;
        tail = new Promise<void>(resolve => { unlock = resolve; });
        await previous;
        return { query, release: unlock };
    }
} as unknown as Pool;
beforeAll(async () => {
    await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
    const sql = await readFile(new URL('../../../../supabase/schema.sql', import.meta.url), 'utf8');
    await pg.exec(sql);
    injectPostgresForTests(pool);
}, 60000);
afterAll(async () => { injectPostgresForTests(undefined); await pg.close(); });
describe('Real embedded PostgreSQL integration (not SQLite or pg-mem)', () => {
    it('migrates the canonical schema and verifies every required table', async () => {
        expect(await checkDatabaseReadiness()).toMatchObject({ connected: true, schemaReady: true, provider: 'postgres' });
    });
    it('registers normal users, persists files and isolates authenticated accounts', async () => {
        const a = await authService.register('pg-a@example.com', 'SecurePass123', 'PG A');
        const b = await authService.register('pg-b@example.com', 'SecurePass123', 'PG B');
        expect(a.user.role).toBe('USER');
        const file = await userStorageService.saveProjectFile(a.user.id, 'snapshot', { value: 42 });
        expect(file.fileName).toBe('snapshot.json');
        expect((await userStorageService.getFileContent(a.user.id, 'projects', file.fileName))?.content).toContain('42');
        expect(await userStorageService.getFileContent(b.user.id, 'projects', file.fileName)).toBeNull();
        expect((await request(app).get('/api/admin/users').set('Authorization', `Bearer ${a.token}`)).status).toBe(403);
        const list = await request(app).get('/api/projects').set('Authorization', `Bearer ${a.token}`);
        expect(list.status).toBe(200);
        expect(list.body.data.projects).toHaveLength(1);
    });
    it('serializes concurrent reservations without lost updates or negative balance', async () => {
        const session = await authService.register('pg-credit@example.com', 'SecurePass123', 'Credit');
        const responses = await Promise.all(Array.from({ length: 12 }, () => creditsService.deductCredits(session.user.id, 10, { description: 'concurrent test' })));
        expect(responses.filter(value => value.success)).toHaveLength(10);
        expect((await creditsService.getUserCredits(session.user.id)).balance).toBe(0);
    });
    it('rolls back a failed PostgreSQL transaction', async () => {
        const db = getOperationalDatabase();
        const user = await authService.register('pg-rollback@example.com', 'SecurePass123', 'Rollback');
        await expect(db.transaction(async () => {
            await creditsService.deductCredits(user.user.id, 25, { description: 'rollback' });
            throw new Error('intentional');
        })()).rejects.toThrow('intentional');
        expect((await creditsService.getUserCredits(user.user.id)).balance).toBe(100);
    });
    it('denies browser-role SQL access to sensitive tables', async () => {
        await pg.exec('SET ROLE anon');
        await expect(pg.query('SELECT password_hash FROM users')).rejects.toThrow();
        await pg.exec('RESET ROLE');
    });
    it('persists and claims queued jobs without fabricated unsupported-node success', async () => {
        const user = await authService.register('pg-jobs@example.com', 'SecurePass123', 'Jobs');
        const definition = { type: 'ai-agent-autonomous', label: 'Agent', category: 'AI' as const, inputs: [], outputs: [] };
        const job = await WorkflowJobs.enqueue(user.user.id, { id: 'local', name: 'Audit', nodes: [{ ...definition, id: 'agent-1', position: { x: 0, y: 0 }, state: 'IDLE' }], connections: [], groups: [], viewport: { x: 0, y: 0, zoom: 1 }, version: 1, createdAt: Date.now(), updatedAt: Date.now() });
        expect((await WorkflowJobs.get(job.id, user.user.id))?.status).toBe('QUEUED');
        await WorkflowJobs.runNext();
        expect((await WorkflowJobs.get(job.id, user.user.id))?.status).toBe('FAILED');
        expect((await creditsService.getUserCredits(user.user.id)).balance).toBe(100);
    });
    it('completes a deterministic queued job and prevents cross-account access or cancellation', async () => {
        const a = await authService.register('pg-job-owner@example.com', 'SecurePass123', 'Owner');
        const b = await authService.register('pg-job-other@example.com', 'SecurePass123', 'Other');
        const workflow = { id: 'local', name: 'Text', nodes: [{ id: 'text-1', type: 'source-text', label: 'Text', category: 'SOURCE' as const, config: { text: 'Real input' }, inputs: [], outputs: [{ id: 'out-text', label: 'Text', type: 'TEXT' as const }], position: { x: 0, y: 0 }, state: 'IDLE' as const }], connections: [], groups: [], viewport: { x: 0, y: 0, zoom: 1 }, version: 1, createdAt: Date.now(), updatedAt: Date.now() };
        const job = await WorkflowJobs.enqueue(a.user.id, workflow);
        expect(await WorkflowJobs.get(job.id, b.user.id)).toBeNull();
        expect(await WorkflowJobs.cancel(job.id, b.user.id)).toBe(false);
        await WorkflowJobs.runNext();
        expect((await WorkflowJobs.get(job.id, a.user.id))?.result.summary).toMatchObject({ status: 'COMPLETED', totalCostCredits: 0 });
        const cancelled = await WorkflowJobs.enqueue(a.user.id, workflow);
        expect(await WorkflowJobs.cancel(cancelled.id, a.user.id)).toBe(true);
        expect(await WorkflowJobs.runNext()).toBe(false);
        expect((await WorkflowJobs.get(cancelled.id, a.user.id))?.status).toBe('STOPPED');
    });
});
