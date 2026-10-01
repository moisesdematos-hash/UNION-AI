import { getOperationalDatabase, databaseProvider } from './operational-database.js';
import { REQUIRED_TABLES } from './migrations.js';
export async function checkDatabaseReadiness() {
    const provider = databaseProvider();
    try {
        const db = getOperationalDatabase();
        await db.prepare('SELECT 1').get();
        // Validate every mandatory table, not merely a reachable server.
        for (const table of REQUIRED_TABLES)
            await db.prepare(`SELECT 1 FROM ${table} LIMIT 1`).get();
        return { connected: true, provider, schemaReady: true };
    }
    catch {
        return { connected: false, provider, schemaReady: false, error: 'Banco indisponível, sem configuração ou schema obrigatório incompleto' };
    }
}
