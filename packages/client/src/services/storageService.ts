import { WorkflowDefinition, WorkflowRun, WorkflowVersion, UserCredits, CreditTransaction } from '@union/shared';

export const LOCAL_STORAGE_WORKFLOW_KEY = 'union_canvas_active_workflow';
export const LOCAL_STORAGE_RUNS_KEY = 'union_canvas_runs_history';
export const LOCAL_STORAGE_VERSIONS_KEY = 'union_canvas_versions';
export const LOCAL_STORAGE_CREDITS_KEY = 'union_canvas_user_credits';
export const LOCAL_STORAGE_CREDIT_TXS_KEY = 'union_canvas_credit_txs';
export const AUTH_TOKEN_KEY = 'union_auth_token';

export interface StorageSyncResult {
  success: boolean;
  isLocalOnly: boolean;
  error?: string;
  savedAt: number;
}

export class StorageService {
  /**
   * Saves workflow directly to LocalStorage for instant zero-loss crash resilience.
   */
  public static saveToLocalStorage(workflow: WorkflowDefinition): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LOCAL_STORAGE_WORKFLOW_KEY, JSON.stringify(workflow));
      }
    } catch (err) {
      console.warn('Failed to save workflow to LocalStorage:', err);
    }
  }

  /**
   * Retrieves workflow from LocalStorage if present.
   */
  public static loadFromLocalStorage(): WorkflowDefinition | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(LOCAL_STORAGE_WORKFLOW_KEY);
        if (raw) {
          return JSON.parse(raw) as WorkflowDefinition;
        }
      }
    } catch (err) {
      console.warn('Failed to load workflow from LocalStorage:', err);
    }
    return null;
  }

  /**
   * Clears saved workflow from LocalStorage.
   */
  public static clearLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(LOCAL_STORAGE_WORKFLOW_KEY);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Synchronizes workflow state with backend SQLite database if server is reachable and auth exists,
   * otherwise safely degrades to LocalStorage.
   */
  public static async syncToServer(
    workflow: WorkflowDefinition,
    authToken?: string | null
  ): Promise<StorageSyncResult> {
    const now = Date.now();

    // 1. Always ensure LocalStorage has the latest snapshot first
    this.saveToLocalStorage(workflow);

    const token = authToken || (typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY));

    // If no token, return local-only success
    if (!token) {
      return {
        success: true,
        isLocalOnly: true,
        savedAt: now
      };
    }

    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: workflow.name,
          viewport: workflow.viewport,
          nodes: workflow.nodes,
          connections: workflow.connections
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          isLocalOnly: true,
          error: errJson.message || `Server responded with ${response.status}`,
          savedAt: now
        };
      }

      return {
        success: true,
        isLocalOnly: false,
        savedAt: now
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return {
        success: true, // gracefully degraded to local
        isLocalOnly: true,
        error: msg,
        savedAt: now
      };
    }
  }

  // --- GATE 12: RUNS & VERSIONS METHODS ---

  public static saveRunLocally(run: WorkflowRun): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const existing = this.loadRunsLocally();
        const updated = [run, ...existing.filter((r) => r.id !== run.id)].slice(0, 100);
        localStorage.setItem(LOCAL_STORAGE_RUNS_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Failed to save run to LocalStorage:', err);
    }
  }

  public static loadRunsLocally(workflowId?: string): WorkflowRun[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(LOCAL_STORAGE_RUNS_KEY);
        if (raw) {
          const list = JSON.parse(raw) as WorkflowRun[];
          return workflowId ? list.filter((r) => r.workflowId === workflowId) : list;
        }
      }
    } catch (err) {
      console.warn('Failed to load runs from LocalStorage:', err);
    }
    return [];
  }

  public static saveVersionLocally(version: WorkflowVersion): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const existing = this.loadVersionsLocally();
        const updated = [version, ...existing.filter((v) => v.id !== version.id)].slice(0, 50);
        localStorage.setItem(LOCAL_STORAGE_VERSIONS_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Failed to save version to LocalStorage:', err);
    }
  }

  public static loadVersionsLocally(workflowId?: string): WorkflowVersion[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(LOCAL_STORAGE_VERSIONS_KEY);
        if (raw) {
          const list = JSON.parse(raw) as WorkflowVersion[];
          return workflowId ? list.filter((v) => v.workflowId === workflowId) : list;
        }
      }
    } catch (err) {
      console.warn('Failed to load versions from LocalStorage:', err);
    }
    return [];
  }

  public static saveCreditsLocally(credits: UserCredits): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LOCAL_STORAGE_CREDITS_KEY, JSON.stringify(credits));
      }
    } catch (err) {
      console.warn('Failed to save credits to LocalStorage:', err);
    }
  }

  public static loadCreditsLocally(): UserCredits | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(LOCAL_STORAGE_CREDITS_KEY);
        if (raw) {
          return JSON.parse(raw) as UserCredits;
        }
      }
    } catch (err) {
      console.warn('Failed to load credits from LocalStorage:', err);
    }
    return null;
  }

  public static saveCreditTransactionsLocally(txs: CreditTransaction[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LOCAL_STORAGE_CREDIT_TXS_KEY, JSON.stringify(txs.slice(0, 100)));
      }
    } catch (err) {
      console.warn('Failed to save credit transactions to LocalStorage:', err);
    }
  }

  public static loadCreditTransactionsLocally(): CreditTransaction[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(LOCAL_STORAGE_CREDIT_TXS_KEY);
        if (raw) {
          return JSON.parse(raw) as CreditTransaction[];
        }
      }
    } catch (err) {
      console.warn('Failed to load credit transactions from LocalStorage:', err);
    }
    return [];
  }

  /**
   * Fetches user's dedicated disk directory overview and list of files
   */
  public static async fetchUserStorageOverview(authToken?: string | null): Promise<any | null> {
    const token = authToken || (typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY));
    if (!token) return null;
    try {
      const res = await fetch('/api/projects/storage/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  }

  /**
   * Saves an e-book or file to user's dedicated folder
   */
  public static async saveToUserFolder(
    category: 'projects' | 'ebooks' | 'assets',
    fileName: string,
    content: string | object,
    extension?: 'json' | 'md' | 'html',
    authToken?: string | null
  ): Promise<boolean> {
    const token = authToken || (typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY));
    if (!token) return false;
    try {
      const res = await fetch('/api/projects/storage/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ category, fileName, content, extension })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

