import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDatabase } from '../db/database.js';
import { env } from '../config/env.js';
import { userStorageService } from './user-storage-service.js';
import { EmailService } from './email/email-service.js';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  avatarUrl?: string;
  authProvider: 'email' | 'google';
  createdAt: number;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
}

export class AuthService {
  private db = getDatabase();

  private isFirstUserOrAdmin(email: string): boolean {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@union.ai').trim().toLowerCase();
    if (email.trim().toLowerCase() === adminEmail) {
      return true;
    }
    const countRow = this.db.prepare('SELECT count(*) as total FROM users').get() as { total: number } | undefined;
    return (countRow?.total ?? 0) === 0;
  }

  async register(email: string, password: string, name: string): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if user already exists
    const existing = this.db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      throw new Error('User already exists with this email');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = randomUUID();
    const now = Date.now();
    const role: 'ADMIN' | 'USER' = this.isFirstUserOrAdmin(normalizedEmail) ? 'ADMIN' : 'USER';
    const authProvider: 'email' | 'google' = 'email';

    // Insert user and initial credits
    const insertUser = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO users (id, email, name, password_hash, role, avatar_url, auth_provider, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, normalizedEmail, name.trim(), passwordHash, role, null, authProvider, now, now);

      this.db.prepare(`
        INSERT INTO user_credits (id, user_id, balance, total_consumed, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), userId, 100.0, 0.0, now);

      // Create a default project for the user
      this.db.prepare(`
        INSERT INTO projects (id, user_id, name, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), userId, 'Default Workspace', 'Main workspace for AI workflows', now, now);
    });

    insertUser();

    // Create dedicated user storage directories on disk
    try {
      userStorageService.getUserDir(userId);
    } catch (e) {
      console.warn('[Auth] Error preparing user directory:', e);
    }

    const user: UserProfile = {
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      role,
      authProvider,
      createdAt: now
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const userRow = this.db.prepare(`
      SELECT id, email, name, password_hash, role, avatar_url, auth_provider, created_at
      FROM users WHERE email = ?
    `).get(normalizedEmail) as {
      id: string;
      email: string;
      name: string;
      password_hash: string;
      role?: string;
      avatar_url?: string;
      auth_provider?: string;
      created_at: number;
    } | undefined;

    if (!userRow) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const user: UserProfile = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: (userRow.role === 'ADMIN' ? 'ADMIN' : 'USER'),
      avatarUrl: userRow.avatar_url || undefined,
      authProvider: (userRow.auth_provider === 'google' ? 'google' : 'email'),
      createdAt: userRow.created_at
    };

    // Ensure user storage folder exists
    try {
      userStorageService.getUserDir(user.id);
    } catch (e) {
      console.warn('[Auth] Error checking user directory on login:', e);
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  async loginWithGoogle(payload: {
    email: string;
    name: string;
    avatarUrl?: string;
    googleId?: string;
  }): Promise<AuthSession> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const existing = this.db.prepare(`
      SELECT id, email, name, role, avatar_url, auth_provider, created_at
      FROM users WHERE email = ?
    `).get(normalizedEmail) as {
      id: string;
      email: string;
      name: string;
      role?: string;
      avatar_url?: string;
      auth_provider?: string;
      created_at: number;
    } | undefined;

    const now = Date.now();

    if (existing) {
      // Update avatar if provided
      if (payload.avatarUrl && payload.avatarUrl !== existing.avatar_url) {
        this.db.prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?').run(payload.avatarUrl, now, existing.id);
      }

      const user: UserProfile = {
        id: existing.id,
        email: existing.email,
        name: existing.name || payload.name.trim(),
        role: existing.role === 'ADMIN' ? 'ADMIN' : 'USER',
        avatarUrl: payload.avatarUrl || existing.avatar_url || undefined,
        authProvider: (existing.auth_provider === 'google' ? 'google' : 'email'),
        createdAt: existing.created_at
      };

      try {
        userStorageService.getUserDir(user.id);
      } catch (e) {
        console.warn('[Auth] Error verifying user directory on google login:', e);
      }

      const token = this.generateToken(user);
      return { user, token };
    }

    // Register new user via Google
    const userId = randomUUID();
    const role: 'ADMIN' | 'USER' = this.isFirstUserOrAdmin(normalizedEmail) ? 'ADMIN' : 'USER';
    const dummyPasswordHash = await bcrypt.hash(randomUUID(), 10);
    const displayName = payload.name.trim() || normalizedEmail.split('@')[0];

    const insertUser = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO users (id, email, name, password_hash, role, avatar_url, auth_provider, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, normalizedEmail, displayName, dummyPasswordHash, role, payload.avatarUrl || null, 'google', now, now);

      this.db.prepare(`
        INSERT INTO user_credits (id, user_id, balance, total_consumed, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), userId, 100.0, 0.0, now);

      this.db.prepare(`
        INSERT INTO projects (id, user_id, name, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), userId, 'Default Workspace', 'Main workspace for AI workflows', now, now);
    });

    insertUser();

    try {
      userStorageService.getUserDir(userId);
    } catch (e) {
      console.warn('[Auth] Error preparing user directory:', e);
    }

    const user: UserProfile = {
      id: userId,
      email: normalizedEmail,
      name: displayName,
      role,
      avatarUrl: payload.avatarUrl,
      authProvider: 'google',
      createdAt: now
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  generateToken(user: UserProfile): string {
    return jwt.sign(
      { sub: user.id, email: user.email, name: user.name, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): { sub: string; email: string; name: string; role?: 'ADMIN' | 'USER' } {
    try {
      return jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string; name: string; role?: 'ADMIN' | 'USER' };
    } catch {
      throw new Error('Invalid or expired authentication token');
    }
  }

  getUserById(userId: string): UserProfile | null {
    const row = this.db.prepare(`
      SELECT id, email, name, role, avatar_url, auth_provider, created_at
      FROM users WHERE id = ?
    `).get(userId) as {
      id: string;
      email: string;
      name: string;
      role?: string;
      avatar_url?: string;
      auth_provider?: string;
      created_at: number;
    } | undefined;

    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role === 'ADMIN' ? 'ADMIN' : 'USER',
      avatarUrl: row.avatar_url || undefined,
      authProvider: row.auth_provider === 'google' ? 'google' : 'email',
      createdAt: row.created_at
    };
  }

  updateUserRole(userId: string, role: 'ADMIN' | 'USER'): boolean {
    const info = this.db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, Date.now(), userId);
    return info.changes > 0;
  }

  async requestPasswordReset(email: string): Promise<{ sent: boolean; devToken?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(normalizedEmail) as { id: string; email: string; name: string } | undefined;

    // To prevent email enumeration, return success even if user not found
    if (!user) {
      return { sent: true };
    }

    const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
    const now = Date.now();
    const expiresAt = now + 60 * 60 * 1000; // 60 minutes

    this.db.prepare(`
      INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(randomUUID(), user.id, token, expiresAt, now);

    await EmailService.sendPasswordResetEmail(user.email, user.name, token);

    return { sent: true, devToken: env.NODE_ENV === 'test' ? token : undefined };
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    const resetRecord = this.db.prepare(`
      SELECT id, user_id, expires_at, used
      FROM password_reset_tokens
      WHERE token = ?
    `).get(token) as { id: string; user_id: string; expires_at: number; used: number } | undefined;

    if (!resetRecord) {
      throw new Error('Invalid password reset token');
    }

    if (resetRecord.used === 1) {
      throw new Error('This password reset token has already been used');
    }

    if (Date.now() > resetRecord.expires_at) {
      throw new Error('Password reset token has expired');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    const now = Date.now();

    const updateTx = this.db.transaction(() => {
      this.db.prepare(`
        UPDATE users
        SET password_hash = ?, updated_at = ?
        WHERE id = ?
      `).run(passwordHash, now, resetRecord.user_id);

      this.db.prepare(`
        UPDATE password_reset_tokens
        SET used = 1
        WHERE id = ?
      `).run(resetRecord.id);
    });

    updateTx();
    return true;
  }
}

export const authService = new AuthService();
