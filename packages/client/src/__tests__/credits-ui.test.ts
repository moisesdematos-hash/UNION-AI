import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store/canvasStore.js';
import { StorageService } from '../services/storageService.js';

describe('Gate 13: Client Credits Store & UI Accounting', () => {
  beforeEach(() => {
    localStorage.clear();
    useCanvasStore.setState({
      userCredits: {
        id: 'cred-test',
        userId: 'test-user',
        balance: 100.0,
        totalConsumed: 0.0,
        updatedAt: Date.now()
      },
      creditTransactions: [],
      isCreditsDrawerOpen: false
    });
  });

  it('should toggle credits drawer state', () => {
    const store = useCanvasStore.getState();
    expect(store.isCreditsDrawerOpen).toBe(false);

    store.openCreditsDrawer();
    expect(useCanvasStore.getState().isCreditsDrawerOpen).toBe(true);

    store.closeCreditsDrawer();
    expect(useCanvasStore.getState().isCreditsDrawerOpen).toBe(false);
  });

  it('should top up credits locally and create audit transaction', async () => {
    const store = useCanvasStore.getState();
    const updated = await store.topupCredits(50, 'pack-50');

    expect(updated).not.toBeNull();
    expect(updated?.balance).toBe(150.0);

    const state = useCanvasStore.getState();
    expect(state.userCredits?.balance).toBe(150.0);
    expect(state.creditTransactions.length).toBe(1);
    expect(state.creditTransactions[0].amount).toBe(50);
    expect(state.creditTransactions[0].type).toBe('TOPUP');
    expect(state.creditTransactions[0].balanceAfter).toBe(150.0);

    // Verify localStorage persistence
    const saved = StorageService.loadCreditsLocally();
    expect(saved?.balance).toBe(150.0);
  });

  it('should deduct credits when recording workflow execution run with cost', async () => {
    const store = useCanvasStore.getState();
    expect(store.userCredits?.balance).toBe(100.0);

    await store.recordExecutionRun({
      status: 'COMPLETED',
      mode: 'RUN',
      totalNodes: 2,
      completedNodes: 2,
      failedNodes: 0,
      totalTokens: 1200,
      totalCostCredits: 0.25,
      durationMs: 450,
      startTime: Date.now() - 450,
      endTime: Date.now()
    });

    const state = useCanvasStore.getState();
    expect(state.userCredits?.balance).toBe(99.75);
    expect(state.userCredits?.totalConsumed).toBe(0.25);
  });

  it('should load saved credits from localStorage via fetchUserCredits', async () => {
    StorageService.saveCreditsLocally({
      id: 'stored-cred',
      userId: 'test-user',
      balance: 85.5,
      totalConsumed: 14.5,
      updatedAt: Date.now()
    });

    useCanvasStore.setState({ userCredits: null });

    const store = useCanvasStore.getState();
    const credits = await store.fetchUserCredits();

    expect(credits?.balance).toBe(85.5);
    expect(credits?.totalConsumed).toBe(14.5);
    expect(useCanvasStore.getState().userCredits?.balance).toBe(85.5);
  });
});
