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
  createdAt: number;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
}

export class AuthService {
  private db = getDatabase();

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

    // Insert user and initial credits
    const insertUser = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, normalizedEmail, name.trim(), passwordHash, now, now);

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
      createdAt: now
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const userRow = this.db.prepare(`
      SELECT id, email, name, password_hash, created_at
      FROM users WHERE email = ?
    `).get(normalizedEmail) as { id: string; email: string; name: string; password_hash: string; created_at: number } | undefined;

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

  generateToken(user: UserProfile): string {
    return jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): { sub: string; email: string; name: string } {
    try {
      return jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string; name: string };
    } catch {
      throw new Error('Invalid or expired authentication token');
    }
  }

  getUserById(userId: string): UserProfile | null {
    const row = this.db.prepare(`
      SELECT id, email, name, created_at
      FROM users WHERE id = ?
    `).get(userId) as { id: string; email: string; name: string; created_at: number } | undefined;

    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at
    };
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
