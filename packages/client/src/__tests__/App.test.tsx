import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import App from '../App.js';
import { useCanvasStore } from '../store/canvasStore.js';

describe('App Component with UnionCanvas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useCanvasStore.getState().resetCanvas();
  });

  it('renders UNION.AI brand and Gate 2 Active badge', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        service: 'UNION.AI Core Server',
        uptimeSeconds: 120
      })
    });

    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /UNION\.AI/i })).toBeInTheDocument();
    expect(screen.getByText(/Gate 18 Active/i)).toBeInTheDocument();
    expect(screen.getByText(/100\.00/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Workflow Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Saved/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Backend: ONLINE/i)).toBeInTheDocument();
    });

    // Check canvas HUD
    expect(screen.getByText(/Nodes:/i)).toBeInTheDocument();
    expect(screen.getByText(/Links:/i)).toBeInTheDocument();
  });

  it('increments node count when Quick Add Node button is clicked', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    });

    render(<App />);

    const addButton = screen.getByTitle(/Quick Add Node/i);
    expect(addButton).toBeInTheDocument();

    expect(useCanvasStore.getState().nodes.length).toBe(0);

    await act(async () => {
      fireEvent.click(addButton);
    });

    expect(useCanvasStore.getState().nodes.length).toBe(1);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('renders Execution HUD when isExecuting is true and handles stop', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    });

    useCanvasStore.setState({
      isExecuting: true,
      executionProgress: { total: 3, completed: 1, percent: 33 },
      executionSummary: {
        status: 'RUNNING',
        mode: 'RUN',
        totalNodes: 3,
        completedNodes: 1,
        failedNodes: 0,
        totalTokens: 250,
        totalCostCredits: 0.015,
        startTime: Date.now(),
        durationMs: 45
      }
    });

    render(<App />);

    expect(screen.getByText(/Running: 1\/3 \(33%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/250 tok/i)).toBeInTheDocument();
    const stopButton = screen.getByTitle(/Stop Workflow Execution/i);
    expect(stopButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(stopButton);
    });
    expect(useCanvasStore.getState().isExecuting).toBe(false);
  });

  it('handles manual save button click and Ctrl+S keyboard shortcut', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    });

    render(<App />);

    const saveButton = screen.getByTitle(/Save now \(Ctrl\+S\)/i);
    expect(saveButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(useCanvasStore.getState().saveStatus).toBe('saved');
    expect(useCanvasStore.getState().lastSavedAt).toBeGreaterThan(0);

    // Test Ctrl+S shortcut
    await act(async () => {
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    });
    expect(useCanvasStore.getState().saveStatus).toBe('saved');
  });
});
