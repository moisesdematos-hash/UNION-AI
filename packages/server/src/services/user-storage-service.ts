import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { getOperationalDatabase, databaseProvider } from '../db/operational-database.js';
export interface UserFileItem {
    name: string;
    relativePath: string;
    category: 'projects' | 'ebooks' | 'assets';
    sizeBytes: number;
    updatedAt: number;
    mimeType?: string;
}
export interface UserStorageOverview {
    userId: string;
    userDir: string;
    totalFiles: number;
    totalSizeBytes: number;
    categories: {
        projects: UserFileItem[];
        ebooks: UserFileItem[];
        assets: UserFileItem[];
    };
}
export class UserStorageService {
    constructor(_legacyLocalDirectory?: string) { }
    // Logical namespace only; never an authoritative local filesystem path.
    getUserDir(userId: string): string { return `storage://${userId}`; }
    private name(value: string): string {
        if (!value || path.basename(value) !== value || value.includes('..') || /[\\/\x00]/.test(value))
            throw new Error('Nome de ficheiro inválido');
        return value.replace(/[^a-zA-Z0-9._-]/g, '_');
    }
    private async save(userId: string, category: 'projects' | 'ebooks' | 'assets', fileName: string, content: string, contentType: string) {
        fileName = this.name(fileName);
        const sizeBytes = Buffer.byteLength(content, 'utf8');
        if (sizeBytes > 2 * 1024 * 1024)
            throw new Error('Ficheiro excede o limite de 2 MB deste armazenamento de texto');
        const now = Date.now();
        await getOperationalDatabase().prepare(`INSERT INTO user_storage_files
      (id, user_id, category, file_name, content_type, size_bytes, storage_provider, storage_path, file_content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, category, file_name) DO UPDATE SET
        file_content = excluded.file_content, content_type = excluded.content_type,
        size_bytes = excluded.size_bytes, updated_at = excluded.updated_at`).run(randomUUID(), userId, category, fileName, contentType, sizeBytes, databaseProvider(), `${category}/${fileName}`, content, now, now);
        return { filePath: `${this.getUserDir(userId)}/${category}/${fileName}`, fileName, sizeBytes };
    }
    async saveProjectFile(userId: string, name: string, content: object | string) {
        const fileName = name.endsWith('.json') ? name : `${name}.json`;
        return (await this.save(userId, 'projects', fileName, typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'application/json'));
    }
    async saveEbookFile(userId: string, name: string, content: string, extension: 'md' | 'json' | 'html' = 'md') {
        const fileName = name.endsWith(`.${extension}`) ? name : `${name}.${extension}`;
        return (await this.save(userId, 'ebooks', fileName, content, extension === 'json' ? 'application/json' : extension === 'html' ? 'text/html' : 'text/markdown'));
    }
    async saveAssetFile(userId: string, name: string, content: object | string) {
        return (await this.save(userId, 'assets', name, typeof content === 'string' ? content : JSON.stringify(content), 'text/plain'));
    }
    async getFileContent(userId: string, category: 'projects' | 'ebooks' | 'assets', name: string) {
        const row = await getOperationalDatabase().prepare('SELECT file_name, file_content, size_bytes FROM user_storage_files WHERE user_id = ? AND category = ? AND file_name = ?').get(userId, category, this.name(name));
        return row ? { fileName: row.file_name, content: row.file_content, sizeBytes: row.size_bytes } : null;
    }
    async deleteFile(userId: string, category: 'projects' | 'ebooks' | 'assets', name: string) {
        return (await getOperationalDatabase().prepare('DELETE FROM user_storage_files WHERE user_id = ? AND category = ? AND file_name = ?').run(userId, category, this.name(name))).changes > 0;
    }
    async listUserFiles(userId: string): Promise<UserStorageOverview> {
        const rows = await getOperationalDatabase().prepare('SELECT file_name, category, size_bytes, updated_at, content_type FROM user_storage_files WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
        const categories: UserStorageOverview['categories'] = { projects: [], ebooks: [], assets: [] };
        for (const row of rows) {
            const category = row.category as keyof typeof categories;
            if (categories[category])
                categories[category].push({ name: row.file_name, relativePath: `${category}/${row.file_name}`, category, sizeBytes: row.size_bytes, updatedAt: row.updated_at, mimeType: row.content_type });
        }
        return { userId, userDir: this.getUserDir(userId), categories, totalFiles: rows.length, totalSizeBytes: rows.reduce((sum, row) => sum + row.size_bytes, 0) };
    }
}
export const userStorageService = new UserStorageService();
