import fs from 'fs';
import path from 'path';

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
  private baseDir: string;

  constructor(customBaseDir?: string) {
    if (customBaseDir) {
      this.baseDir = customBaseDir;
    } else if (process.env.VERCEL) {
      this.baseDir = '/tmp/union-data/users';
    } else {
      // Default to data/users relative to root or server directory
      const defaultDir = path.resolve(process.cwd(), 'packages/server/data/users');
      const fallbackDir = path.resolve(process.cwd(), 'data/users');
      this.baseDir = fs.existsSync(path.resolve(process.cwd(), 'packages/server')) ? defaultDir : fallbackDir;
    }
    this.ensureDirectory(this.baseDir);
  }

  private ensureDirectory(dirPath: string): void {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (err) {
      console.warn('[UserStorageService] Directory creation failed, falling back to /tmp:', err);
      this.baseDir = '/tmp/union-data/users';
      try {
        if (!fs.existsSync(this.baseDir)) {
          fs.mkdirSync(this.baseDir, { recursive: true });
        }
      } catch {}
    }
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_');
  }

  public getUserDir(userId: string): string {
    const safeUserId = this.sanitizeName(userId);
    const userDir = path.join(this.baseDir, safeUserId);
    this.ensureDirectory(userDir);
    this.ensureDirectory(path.join(userDir, 'projects'));
    this.ensureDirectory(path.join(userDir, 'ebooks'));
    this.ensureDirectory(path.join(userDir, 'assets'));
    return userDir;
  }

  public saveProjectFile(
    userId: string,
    projectName: string,
    content: object | string
  ): { filePath: string; fileName: string; sizeBytes: number } {
    const userDir = this.getUserDir(userId);
    const safeName = this.sanitizeName(projectName);
    const fileName = safeName.endsWith('.json') ? safeName : `${safeName}.json`;
    const filePath = path.join(userDir, 'projects', fileName);

    const stringData = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    fs.writeFileSync(filePath, stringData, 'utf-8');
    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileName,
      sizeBytes: stats.size
    };
  }

  public saveEbookFile(
    userId: string,
    title: string,
    content: string,
    extension: 'md' | 'json' | 'html' = 'md'
  ): { filePath: string; fileName: string; sizeBytes: number } {
    const userDir = this.getUserDir(userId);
    const safeTitle = this.sanitizeName(title);
    const fileName = safeTitle.endsWith(`.${extension}`) ? safeTitle : `${safeTitle}.${extension}`;
    const filePath = path.join(userDir, 'ebooks', fileName);

    fs.writeFileSync(filePath, content, 'utf-8');
    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileName,
      sizeBytes: stats.size
    };
  }

  public getFileContent(
    userId: string,
    category: 'projects' | 'ebooks' | 'assets',
    fileName: string
  ): { fileName: string; content: string; sizeBytes: number } | null {
    const userDir = this.getUserDir(userId);
    const safeName = path.basename(fileName);
    const targetPath = path.join(userDir, category, safeName);

    if (!fs.existsSync(targetPath)) {
      return null;
    }

    const content = fs.readFileSync(targetPath, 'utf-8');
    const stats = fs.statSync(targetPath);

    return {
      fileName: safeName,
      content,
      sizeBytes: stats.size
    };
  }

  public deleteFile(
    userId: string,
    category: 'projects' | 'ebooks' | 'assets',
    fileName: string
  ): boolean {
    const userDir = this.getUserDir(userId);
    const safeName = path.basename(fileName);
    const targetPath = path.join(userDir, category, safeName);

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return true;
    }
    return false;
  }

  public listUserFiles(userId: string): UserStorageOverview {
    const userDir = this.getUserDir(userId);
    const categories: UserStorageOverview['categories'] = {
      projects: [],
      ebooks: [],
      assets: []
    };

    let totalFiles = 0;
    let totalSizeBytes = 0;

    const subDirs: Array<'projects' | 'ebooks' | 'assets'> = ['projects', 'ebooks', 'assets'];

    for (const cat of subDirs) {
      const catPath = path.join(userDir, cat);
      if (fs.existsSync(catPath)) {
        const files = fs.readdirSync(catPath);
        for (const file of files) {
          const filePath = path.join(catPath, file);
          try {
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              const item: UserFileItem = {
                name: file,
                relativePath: `${cat}/${file}`,
                category: cat,
                sizeBytes: stat.size,
                updatedAt: stat.mtimeMs,
                mimeType: file.endsWith('.json')
                  ? 'application/json'
                  : file.endsWith('.md')
                  ? 'text/markdown'
                  : 'application/octet-stream'
              };
              categories[cat].push(item);
              totalFiles += 1;
              totalSizeBytes += stat.size;
            }
          } catch {
            // Ignore unreadable
          }
        }
      }
    }

    categories.projects.sort((a, b) => b.updatedAt - a.updatedAt);
    categories.ebooks.sort((a, b) => b.updatedAt - a.updatedAt);
    categories.assets.sort((a, b) => b.updatedAt - a.updatedAt);

    return {
      userId,
      userDir,
      totalFiles,
      totalSizeBytes,
      categories
    };
  }
}

export const userStorageService = new UserStorageService();
