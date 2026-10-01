import { randomUUID } from 'crypto';
import { getOperationalDatabase } from '../db/operational-database.js';
import type { UserCredits, CreditTransaction, CreditTransactionType } from '@union/shared';
export interface DeductCreditsOptions {
    workflowId?: string | null;
    runId?: string | null;
    description: string;
}
export interface AddCreditsOptions {
    type?: CreditTransactionType;
    description: string;
    workflowId?: string | null;
    runId?: string | null;
}
export interface DeductionResult {
    success: boolean;
    newBalance: number;
    transaction?: CreditTransaction;
    error?: string;
}
export class CreditsService {
    private db = getOperationalDatabase();
    /**
     * Get user credits, initializing if not present.
     */
    async getUserCredits(userId: string): Promise<UserCredits> {
        let row = (await this.db.prepare('SELECT id, user_id, balance, total_consumed, updated_at FROM user_credits WHERE user_id = ?').get(userId)) as {
            id: string;
            user_id: string;
            balance: number;
            total_consumed: number;
            updated_at: number;
        } | undefined;
        if (!row) {
            const id = randomUUID();
            const now = Date.now();
            (await this.db.prepare('INSERT INTO user_credits (id, user_id, balance, total_consumed, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, userId, 100.0, 0.0, now));
            return {
                id,
                userId,
                balance: 100.0,
                totalConsumed: 0.0,
                updatedAt: now
            };
        }
        return {
            id: row.id,
            userId: row.user_id,
            balance: Math.round(row.balance * 100000) / 100000,
            totalConsumed: Math.round(row.total_consumed * 100000) / 100000,
            updatedAt: row.updated_at
        };
    }
    /**
     * Check if user has sufficient credits quota.
     */
    async checkQuota(userId: string, estimatedCost: number): Promise<{
        allowed: boolean;
        balance: number;
        shortfall: number;
    }> {
        const credits = (await this.getUserCredits(userId));
        const balance = credits.balance;
        const cost = Math.max(0, estimatedCost);
        const allowed = balance >= cost && balance > 0;
        const shortfall = allowed ? 0 : Math.max(0, cost - balance);
        return {
            allowed,
            balance,
            shortfall: Math.round(shortfall * 100000) / 100000
        };
    }
    /**
     * Deduct credits atomically within a SQLite transaction.
     * Prevents race conditions and negative balances.
     */
    async deductCredits(userId: string, amount: number, options: DeductCreditsOptions): Promise<DeductionResult> {
        const deductAmount = Math.max(0, Math.round(amount * 100000) / 100000);
        if (deductAmount === 0) {
            const current = (await this.getUserCredits(userId));
            return { success: true, newBalance: current.balance };
        }
        const runDeduction = this.db.transaction(async () => {
            await this.db.lock(`credits:${userId}`);
            let row = (await this.db.prepare('SELECT id, balance, total_consumed FROM user_credits WHERE user_id = ?').get(userId)) as {
                id: string;
                balance: number;
                total_consumed: number;
            } | undefined;
            if (!row) {
                (await this.getUserCredits(userId));
                row = (await this.db.prepare('SELECT id, balance, total_consumed FROM user_credits WHERE user_id = ?').get(userId)) as {
                    id: string;
                    balance: number;
                    total_consumed: number;
                };
            }
            if (row.balance < deductAmount) {
                return {
                    success: false,
                    newBalance: Math.round(row.balance * 100000) / 100000,
                    error: 'INSUFFICIENT_CREDITS'
                };
            }
            const newBalance = Math.round((row.balance - deductAmount) * 100000) / 100000;
            const newTotalConsumed = Math.round((row.total_consumed + deductAmount) * 100000) / 100000;
            const now = Date.now();
            const updateResult = (await this.db.prepare('UPDATE user_credits SET balance = ?, total_consumed = ?, updated_at = ? WHERE user_id = ? AND balance >= ?').run(newBalance, newTotalConsumed, now, userId, deductAmount));
            if (updateResult.changes === 0) {
                return {
                    success: false,
                    newBalance: Math.round(row.balance * 100000) / 100000,
                    error: 'CONCURRENT_UPDATE_CONFLICT'
                };
            }
            const txId = randomUUID();
            (await this.db.prepare('INSERT INTO credit_transactions (id, user_id, workflow_id, run_id, amount, type, description, balance_after, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(txId, userId, options.workflowId || null, options.runId || null, -deductAmount, 'CONSUMPTION', options.description, newBalance, now));
            const transaction: CreditTransaction = {
                id: txId,
                userId,
                workflowId: options.workflowId || null,
                runId: options.runId || null,
                amount: -deductAmount,
                type: 'CONSUMPTION',
                description: options.description,
                balanceAfter: newBalance,
                createdAt: now
            };
            return {
                success: true,
                newBalance,
                transaction
            };
        });
        return (await runDeduction());
    }
    /**
     * Add credits (Topup, Bonus, Refund) atomically.
     */
    async addCredits(userId: string, amount: number, options: AddCreditsOptions): Promise<UserCredits> {
        const addAmount = Math.max(0, Math.round(amount * 100000) / 100000);
        const type = options.type || 'TOPUP';
        const runAddition = this.db.transaction(async () => {
            await this.db.lock(`credits:${userId}`);
            let row = (await this.db.prepare('SELECT id, balance, total_consumed FROM user_credits WHERE user_id = ?').get(userId)) as {
                id: string;
                balance: number;
                total_consumed: number;
            } | undefined;
            if (!row) {
                (await this.getUserCredits(userId));
                row = (await this.db.prepare('SELECT id, balance, total_consumed FROM user_credits WHERE user_id = ?').get(userId)) as {
                    id: string;
                    balance: number;
                    total_consumed: number;
                };
            }
            const newBalance = Math.round((row.balance + addAmount) * 100000) / 100000;
            const newConsumed = type === 'REFUND' ? Math.max(0, row.total_consumed - addAmount) : row.total_consumed;
            const now = Date.now();
            (await this.db.prepare('UPDATE user_credits SET balance = ?, total_consumed = ?, updated_at = ? WHERE user_id = ?').run(newBalance, newConsumed, now, userId));
            const txId = randomUUID();
            (await this.db.prepare('INSERT INTO credit_transactions (id, user_id, workflow_id, run_id, amount, type, description, balance_after, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(txId, userId, options.workflowId || null, options.runId || null, addAmount, type, options.description, newBalance, now));
            return {
                id: row.id,
                userId,
                balance: newBalance,
                totalConsumed: Math.round(newConsumed * 100000) / 100000,
                updatedAt: now
            };
        });
        return (await runAddition());
    }
    /**
     * List recent credit transactions for user.
     */
    async listTransactions(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
        const rows = (await this.db.prepare('SELECT id, user_id, workflow_id, run_id, amount, type, description, balance_after, created_at FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit)) as Array<{
            id: string;
            user_id: string;
            workflow_id: string | null;
            run_id: string | null;
            amount: number;
            type: string;
            description: string;
            balance_after: number;
            created_at: number;
        }>;
        return rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            workflowId: r.workflow_id,
            runId: r.run_id,
            amount: r.amount,
            type: r.type as CreditTransactionType,
            description: r.description,
            balanceAfter: r.balance_after,
            createdAt: r.created_at
        }));
    }
}
export const creditsService = new CreditsService();
