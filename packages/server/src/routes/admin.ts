import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { getDatabase } from '../db/database.js';
import { authService } from '../services/auth.js';
import { creditsService } from '../services/credits-service.js';
import { getActiveDatabaseProvider, isSupabaseConfigured } from '../db/supabase-client.js';
import { env } from '../config/env.js';
import { CREDIT_PACKAGES } from '../services/payment/payment-service.js';
import { randomUUID } from 'crypto';

export const adminRouter = Router();

// Protect all admin endpoints with requireAuth and requireAdmin
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

/**
 * GET /api/admin/metrics
 * Comprehensive platform KPIs & system status.
 */
adminRouter.get('/metrics', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDatabase();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Users KPIs
    const totalUsersRow = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
    const recentUsersRow = db.prepare('SELECT count(*) as count FROM users WHERE created_at >= ?').get(sevenDaysAgo) as { count: number };
    const adminUsersRow = db.prepare("SELECT count(*) as count FROM users WHERE role = 'ADMIN'").get() as { count: number };

    // Credits KPIs
    const creditsRow = db.prepare(`
      SELECT 
        COALESCE(SUM(balance), 0) as totalBalance,
        COALESCE(SUM(total_consumed), 0) as totalConsumed
      FROM user_credits
    `).get() as { totalBalance: number; totalConsumed: number };

    // Workflows & Runs KPIs
    const workflowsRow = db.prepare('SELECT count(*) as count FROM workflows').get() as { count: number };
    const runsRow = db.prepare('SELECT count(*) as count FROM workflow_runs').get() as { count: number };
    const tokensRow = db.prepare(`
      SELECT 
        COALESCE(SUM(total_tokens), 0) as totalTokens,
        COALESCE(SUM(total_cost_credits), 0) as totalRunCost
      FROM workflow_runs
    `).get() as { totalTokens: number; totalRunCost: number };

    // Financial Transactions KPIs (Angola & Global)
    const txCountRow = db.prepare('SELECT count(*) as count FROM processed_payments').get() as { count: number };
    
    // Angola volume (Kz AOA)
    const aoaVolumeRow = db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total 
      FROM processed_payments 
      WHERE provider IN ('multicaixa', 'multicaixa_express', 'multicaixa_ref', 'paypay')
    `).get() as { total: number };

    // Brazil volume (BRL)
    const brlVolumeRow = db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total 
      FROM processed_payments 
      WHERE provider = 'pix'
    `).get() as { total: number };

    // Global volume (USD)
    const usdVolumeRow = db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total 
      FROM processed_payments 
      WHERE provider = 'stripe'
    `).get() as { total: number };

    // Provider Breakdown
    const providerBreakdown = db.prepare(`
      SELECT provider, count(*) as count, COALESCE(SUM(amount_paid), 0) as totalAmount
      FROM processed_payments
      GROUP BY provider
    `).all() as Array<{ provider: string; count: number; totalAmount: number }>;

    // System Telemetry
    const dbProvider = getActiveDatabaseProvider();
    const supabaseActive = isSupabaseConfigured();

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsersRow.count,
          last7Days: recentUsersRow.count,
          admins: adminUsersRow.count
        },
        credits: {
          totalBalance: Math.round(creditsRow.totalBalance * 100) / 100,
          totalConsumed: Math.round(creditsRow.totalConsumed * 100) / 100,
          circulatingEstimated: Math.round((creditsRow.totalBalance + creditsRow.totalConsumed) * 100) / 100
        },
        activity: {
          workflows: workflowsRow.count,
          runs: runsRow.count,
          tokensConsumed: tokensRow.totalTokens,
          aiCostCredits: Math.round(tokensRow.totalRunCost * 100) / 100
        },
        financial: {
          totalTransactions: txCountRow.count,
          totalAoa: aoaVolumeRow.total,
          totalAoaFormatted: `${aoaVolumeRow.total.toLocaleString('pt-AO')} Kz`,
          totalBrl: brlVolumeRow.total,
          totalUsd: usdVolumeRow.total,
          byProvider: providerBreakdown
        },
        system: {
          dbProvider,
          supabaseConfigured: supabaseActive,
          groqModel: env.GROQ_MODEL || 'openai/gpt-oss-120b',
          nodeEnv: env.NODE_ENV,
          uptimeSeconds: Math.floor(process.uptime()),
          memoryRssMb: Math.round(process.memoryUsage().rss / (1024 * 1024))
        }
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao buscar métricas administrativas';
    res.status(500).json({ status: 'error', message });
  }
});

/**
 * GET /api/admin/users
 * Paginated user directory with search, roles, and balances.
 */
adminRouter.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDatabase();
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT count(*) as total FROM users';
    let usersQuery = `
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.role, 
        u.avatar_url, 
        u.auth_provider, 
        u.created_at,
        COALESCE(c.balance, 0) as credits_balance,
        COALESCE(c.total_consumed, 0) as credits_consumed,
        (SELECT count(*) FROM workflows w WHERE w.project_id IN (SELECT p.id FROM projects p WHERE p.user_id = u.id)) as workflows_count,
        (SELECT count(*) FROM workflow_runs wr WHERE wr.user_id = u.id) as runs_count
      FROM users u
      LEFT JOIN user_credits c ON u.id = c.user_id
    `;

    const params: unknown[] = [];

    if (q) {
      countQuery += ' WHERE LOWER(email) LIKE ? OR LOWER(name) LIKE ?';
      usersQuery += ' WHERE LOWER(u.email) LIKE ? OR LOWER(u.name) LIKE ?';
      const wildcard = `%${q}%`;
      params.push(wildcard, wildcard);
    }

    usersQuery += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';

    const countRow = db.prepare(countQuery).get(...params) as { total: number };
    const users = db.prepare(usersQuery).all(...params, limit, offset) as Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      avatar_url: string | null;
      auth_provider: string | null;
      created_at: number;
      credits_balance: number;
      credits_consumed: number;
      workflows_count: number;
      runs_count: number;
    }>;

    res.status(200).json({
      status: 'success',
      data: {
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role || 'USER',
          avatarUrl: u.avatar_url || undefined,
          authProvider: u.auth_provider || 'email',
          createdAt: u.created_at,
          credits: {
            balance: Math.round(u.credits_balance * 100) / 100,
            totalConsumed: Math.round(u.credits_consumed * 100) / 100
          },
          workflowsCount: u.workflows_count,
          runsCount: u.runs_count
        })),
        pagination: {
          total: countRow.total,
          page,
          limit,
          totalPages: Math.ceil(countRow.total / limit)
        }
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao listar usuários';
    res.status(500).json({ status: 'error', message });
  }
});

const UpdateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'USER'])
});

/**
 * PATCH /api/admin/users/:id/role
 * Changes user role (promote to ADMIN / demote to USER).
 */
adminRouter.patch('/users/:id/role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const { role } = UpdateRoleSchema.parse(req.body);

    const targetUser = authService.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ status: 'error', message: 'Utilizador não encontrado' });
    }

    // Prevent demoting self if no other admin exists
    if (req.user!.id === targetUserId && role !== 'ADMIN') {
      const db = getDatabase();
      const adminCount = (db.prepare("SELECT count(*) as count FROM users WHERE role = 'ADMIN'").get() as { count: number }).count;
      if (adminCount <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Não é possível remover seu próprio privilégio de administrador sendo o único administrador do sistema.'
        });
      }
    }

    authService.updateUserRole(targetUserId, role);

    res.status(200).json({
      status: 'success',
      message: `Cargo do utilizador ${targetUser.email} atualizado para ${role}`,
      data: {
        userId: targetUserId,
        role
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao atualizar cargo do usuário';
    res.status(400).json({ status: 'error', message });
  }
});

const AdjustCreditsSchema = z.object({
  amount: z.number(),
  mode: z.enum(['add', 'set']).default('add'),
  reason: z.string().optional()
});

/**
 * PATCH /api/admin/users/:id/credits
 * Manually adjusts credit balance with audit trail.
 */
adminRouter.patch('/users/:id/credits', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const { amount, mode, reason } = AdjustCreditsSchema.parse(req.body);

    const targetUser = authService.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ status: 'error', message: 'Utilizador não encontrado' });
    }

    const current = creditsService.getUserCredits(targetUserId);
    let newBalance = current.balance;

    const db = getDatabase();
    const now = Date.now();
    const txId = randomUUID();
    const desc = reason || `Ajuste administrativo manual realizado por ${req.user!.name} (${req.user!.email})`;

    if (mode === 'add') {
      newBalance = Math.max(0, current.balance + amount);
      const diff = amount;

      db.transaction(() => {
        db.prepare(`
          UPDATE user_credits
          SET balance = ?, updated_at = ?
          WHERE user_id = ?
        `).run(newBalance, now, targetUserId);

        db.prepare(`
          INSERT INTO credit_transactions (id, user_id, amount, type, description, balance_after, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(txId, targetUserId, diff, diff >= 0 ? 'TOPUP' : 'CONSUMPTION', desc, newBalance, now);
      })();
    } else {
      newBalance = Math.max(0, amount);
      const diff = newBalance - current.balance;

      db.transaction(() => {
        db.prepare(`
          UPDATE user_credits
          SET balance = ?, updated_at = ?
          WHERE user_id = ?
        `).run(newBalance, now, targetUserId);

        db.prepare(`
          INSERT INTO credit_transactions (id, user_id, amount, type, description, balance_after, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(txId, targetUserId, diff, 'TOPUP', `${desc} (Saldo redefinido)`, newBalance, now);
      })();
    }

    res.status(200).json({
      status: 'success',
      message: `Saldo de créditos atualizado com sucesso para ${newBalance.toFixed(2)} cr`,
      data: {
        userId: targetUserId,
        previousBalance: current.balance,
        newBalance: Math.round(newBalance * 100) / 100
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao ajustar créditos do usuário';
    res.status(400).json({ status: 'error', message });
  }
});

/**
 * GET /api/admin/transactions
 * Audit list of payment transactions across Angola and global gateways.
 */
adminRouter.get('/transactions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDatabase();
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
    const provider = typeof req.query.provider === 'string' ? req.query.provider.trim() : '';

    let sql = `
      SELECT 
        p.id, 
        p.provider, 
        p.provider_payment_id, 
        p.user_id, 
        p.package_id, 
        p.amount_paid, 
        p.credits_amount, 
        p.status, 
        p.metadata_json, 
        p.created_at,
        u.email as user_email,
        u.name as user_name
      FROM processed_payments p
      LEFT JOIN users u ON p.user_id = u.id
    `;

    const params: unknown[] = [];
    if (provider) {
      sql += ' WHERE p.provider = ?';
      params.push(provider);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(sql).all(...params) as Array<{
      id: string;
      provider: string;
      provider_payment_id: string;
      user_id: string;
      package_id: string;
      amount_paid: number;
      credits_amount: number;
      status: string;
      metadata_json: string;
      created_at: number;
      user_email: string | null;
      user_name: string | null;
    }>;

    res.status(200).json({
      status: 'success',
      data: rows.map(r => ({
        id: r.id,
        provider: r.provider,
        providerPaymentId: r.provider_payment_id,
        userId: r.user_id,
        userName: r.user_name || 'Desconhecido',
        userEmail: r.user_email || 'N/A',
        packageId: r.package_id,
        amountPaid: r.amount_paid,
        creditsAmount: r.credits_amount,
        status: r.status,
        createdAt: r.created_at,
        metadata: (() => {
          try {
            return JSON.parse(r.metadata_json || '{}');
          } catch {
            return {};
          }
        })()
      }))
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao buscar transações';
    res.status(500).json({ status: 'error', message });
  }
});

const ManualCreditSchema = z.object({
  userId: z.string().min(1),
  packageId: z.string().min(1),
  provider: z.string().default('multicaixa_ref'),
  receiptReference: z.string().optional(),
  note: z.string().optional()
});

/**
 * POST /api/admin/transactions/manual-credit
 * Approves a manual wire transfer / receipt payment and tops up user wallet.
 */
adminRouter.post('/transactions/manual-credit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, packageId, provider, receiptReference, note } = ManualCreditSchema.parse(req.body);

    const targetUser = authService.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ status: 'error', message: 'Utilizador não encontrado' });
    }

    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) {
      return res.status(400).json({ status: 'error', message: `Pacote de créditos inválido: "${packageId}"` });
    }

    const db = getDatabase();
    const now = Date.now();
    const paymentId = `manual_proof_${receiptReference || randomUUID().slice(0, 8)}_${now}`;

    // Record in processed_payments with idempotency
    const existing = db.prepare('SELECT id FROM processed_payments WHERE provider_payment_id = ?').get(paymentId);
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Este comprovativo/referência já foi processado anteriormente.' });
    }

    db.transaction(() => {
      db.prepare(`
        INSERT INTO processed_payments (
          id, provider, provider_payment_id, user_id, package_id,
          amount_paid, credits_amount, status, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(),
        provider,
        paymentId,
        userId,
        pkg.id,
        pkg.priceAoa,
        pkg.credits,
        'PAID',
        JSON.stringify({
          approvedBy: req.user!.email,
          receiptReference,
          note: note || 'Aprovação manual administrativa via comprovativo bancário'
        }),
        now
      );

      creditsService.addCredits(userId, pkg.credits, {
        type: 'TOPUP',
        description: `Recarga Manual Aprovada por Admin (${pkg.label}: +${pkg.credits} cr)`
      });
    })();

    res.status(200).json({
      status: 'success',
      message: `Recarga de +${pkg.credits} créditos aprovada com sucesso para ${targetUser.email}`,
      data: {
        userId,
        creditsAdded: pkg.credits,
        package: pkg.label
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao conceder crédito manual';
    res.status(400).json({ status: 'error', message });
  }
});

/**
 * GET /api/admin/logs
 * Recent AI execution history and errors.
 */
adminRouter.get('/logs', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDatabase();
    const recentRuns = db.prepare(`
      SELECT 
        wr.id, 
        wr.workflow_id, 
        wr.user_id, 
        wr.status, 
        wr.mode, 
        wr.total_nodes, 
        wr.completed_nodes, 
        wr.failed_nodes, 
        wr.total_tokens, 
        wr.total_cost_credits, 
        wr.duration_ms, 
        wr.created_at,
        u.email as user_email
      FROM workflow_runs wr
      LEFT JOIN users u ON wr.user_id = u.id
      ORDER BY wr.created_at DESC
      LIMIT 30
    `).all();

    const recentErrors = db.prepare(`
      SELECT 
        eh.id, 
        eh.workflow_id, 
        eh.user_id, 
        eh.node_id, 
        eh.status, 
        eh.error, 
        eh.provider, 
        eh.model, 
        eh.created_at,
        u.email as user_email
      FROM execution_history eh
      LEFT JOIN users u ON eh.user_id = u.id
      WHERE eh.status = 'ERROR' OR eh.error IS NOT NULL
      ORDER BY eh.created_at DESC
      LIMIT 20
    `).all();

    res.status(200).json({
      status: 'success',
      data: {
        recentRuns,
        recentErrors
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao buscar logs administrativos';
    res.status(500).json({ status: 'error', message });
  }
});
