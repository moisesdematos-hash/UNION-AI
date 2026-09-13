import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App.js';
import { useCanvasStore } from '../store/canvasStore.js';

describe('Gate 18: Template Library UI & Canvas Loading', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useCanvasStore.getState().resetCanvas();
  });

  it('renders Gate 18 Active badge and Templates button in header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', service: 'UNION.AI Core Server' })
    });

    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /UNION\.AI/i })).toBeInTheDocument();
    expect(screen.getByText(/Gate 18 Active/i)).toBeInTheDocument();

    const toolsBtn = screen.queryByTitle(/Mais Ferramentas/i);
    if (toolsBtn) {
      await act(async () => {
        fireEvent.click(toolsBtn);
      });
    }

    const templatesBtn = screen.getByTitle(/Abrir Biblioteca de Templates/i);
    expect(templatesBtn).toBeInTheDocument();
  });

  it('opens TemplateLibraryModal and displays all official templates with categories', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    });

    render(<App />);

    const toolsBtn = screen.queryByTitle(/Mais Ferramentas/i);
    if (toolsBtn) {
      await act(async () => {
        fireEvent.click(toolsBtn);
      });
    }

    const templatesBtn = screen.getByTitle(/Abrir Biblioteca de Templates/i);
    await act(async () => {
      fireEvent.click(templatesBtn);
    });

    // Modal should be visible
    expect(screen.getByTestId('template-library-modal')).toBeInTheDocument();
    expect(screen.getByText(/Biblioteca de Workflow Templates/i)).toBeInTheDocument();

    // Verify official templates are displayed
    expect(screen.getByText('YouTube Content Factory')).toBeInTheDocument();
    expect(screen.getByText('Competitor Intelligence Matrix')).toBeInTheDocument();
    expect(screen.getByText('Autonomous Marketing VSL Engine')).toBeInTheDocument();

    // Test category filter
    const marketingFilter = screen.getByRole('button', { name: 'Marketing' });
    await act(async () => {
      fireEvent.click(marketingFilter);
    });

    expect(screen.getByText('Autonomous Marketing VSL Engine')).toBeInTheDocument();
    expect(screen.queryByText('YouTube Content Factory')).not.toBeInTheDocument();
  }, 15000);

  it('instantiates a selected template directly into the canvas store', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    });

    render(<App />);

    expect(useCanvasStore.getState().nodes).toHaveLength(0);

    const toolsBtn = screen.queryByTitle(/Mais Ferramentas/i);
    if (toolsBtn) {
      await act(async () => {
        fireEvent.click(toolsBtn);
      });
    }

    const templatesBtn = screen.getByTitle(/Abrir Biblioteca de Templates/i);
    await act(async () => {
      fireEvent.click(templatesBtn);
    });

    const loadButtons = screen.getAllByRole('button', { name: /Carregar no Canvas/i });
    expect(loadButtons.length).toBeGreaterThanOrEqual(1);

    // Click load on first template (YouTube Content Factory)
    await act(async () => {
      fireEvent.click(loadButtons[0]);
    });

    // Check that nodes and edges are populated in canvas store
    const storeState = useCanvasStore.getState();
    expect(storeState.nodes.length).toBe(4);
    expect(storeState.edges.length).toBe(3);
    expect(storeState.workflowName).toBe('YouTube Content Factory');
  }, 15000);
});
