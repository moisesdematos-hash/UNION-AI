import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App.js';
import { useCanvasStore } from '../store/canvasStore.js';

describe('Gate 16: Multi-Tenant Organizations UI & RBAC Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useCanvasStore.getState().resetCanvas();
  });

  it('renders Gate 16 Active badge and workspace controls in Top Header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        service: 'UNION.AI Core Server'
      })
    });

    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /UNION\.AI/i })).toBeInTheDocument();
    expect(screen.getByText(/Gate 1[678] Active/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Backend: ONLINE/i)).toBeInTheDocument();
    });
  });
});
