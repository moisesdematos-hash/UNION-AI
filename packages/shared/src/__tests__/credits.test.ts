import { describe, it, expect } from 'vitest';
import {
  CreditTransactionSchema,
  UserCreditsSchema,
  TopupRequestSchema
} from '../types/credits.js';

describe('Shared Credits Schemas', () => {
  it('should validate valid UserCredits object', () => {
    const valid = {
      id: 'cred-1',
      userId: 'user-1',
      balance: 100.5,
      totalConsumed: 14.2,
      updatedAt: Date.now()
    };
    const parsed = UserCreditsSchema.parse(valid);
    expect(parsed.balance).toBe(100.5);
    expect(parsed.totalConsumed).toBe(14.2);
  });

  it('should reject negative balance in UserCredits', () => {
    const invalid = {
      id: 'cred-1',
      userId: 'user-1',
      balance: -5.0,
      totalConsumed: 10,
      updatedAt: Date.now()
    };
    expect(() => UserCreditsSchema.parse(invalid)).toThrow();
  });

  it('should validate valid CreditTransaction object', () => {
    const valid = {
      id: 'tx-1',
      userId: 'user-1',
      workflowId: 'wf-1',
      runId: 'run-1',
      amount: -0.045,
      type: 'CONSUMPTION' as const,
      description: 'AI Writer completion execution',
      balanceAfter: 99.955,
      createdAt: Date.now()
    };
    const parsed = CreditTransactionSchema.parse(valid);
    expect(parsed.type).toBe('CONSUMPTION');
    expect(parsed.amount).toBe(-0.045);
  });

  it('should validate valid TopupRequest', () => {
    const req = {
      amount: 50,
      packageId: 'starter-50',
      description: 'Stripe Refill'
    };
    const parsed = TopupRequestSchema.parse(req);
    expect(parsed.amount).toBe(50);
  });
});
