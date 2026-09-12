import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import App from '../App.js';
import { useCanvasStore } from '../store/canvasStore.js';

describe('Union Forge & Aceleradores (Inspired by Furion.ai enhancements)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useCanvasStore.getState().resetCanvas();
  });

  it('renders the ⚡ Union Forge button in the main top header', () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', service: 'UNION.AI Core Server' })
    });

    render(<App />);

    const forgeBtn = screen.getByTitle(/Union Forge: Criação Direta/i);
    expect(forgeBtn).toBeInTheDocument();
    expect(forgeBtn).toHaveTextContent(/⚡ Union Forge/i);
  });

  it('opens Union Forge modal with the 4 creators when clicked', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    });

    render(<App />);

    const forgeBtn = screen.getByTitle(/Union Forge: Criação Direta/i);
    await act(async () => {
      fireEvent.click(forgeBtn);
    });

    // Check modal visibility
    const modal = screen.getByTestId('union-forge-modal');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getAllByText(/UNION FORGE/i).length).toBeGreaterThan(0);
    expect(within(modal).getAllByText(/ACELERADORES/i).length).toBeGreaterThan(0);

    // 4 creation cards
    expect(within(modal).getByText(/📖 E-book Completo/i)).toBeInTheDocument();
    expect(within(modal).getByText(/🖼️ Criativo Visual/i)).toBeInTheDocument();
    expect(within(modal).getByText(/📦 Oferta & Produto/i)).toBeInTheDocument();
    expect(within(modal).getByText(/👤 Avatar ICP/i)).toBeInTheDocument();
  });

  it('switches to Aceleradores tab and shows viral boosters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    });

    render(<App />);

    const forgeBtn = screen.getByTitle(/Union Forge: Criação Direta/i);
    await act(async () => {
      fireEvent.click(forgeBtn);
    });

    const modal = screen.getByTestId('union-forge-modal');

    // Click on Aceleradores tab
    const accTabBtn = within(modal).getByText(/🚀 Aceleradores Virais/i);
    await act(async () => {
      fireEvent.click(accTabBtn);
    });

    expect(within(modal).getAllByText(/Fábrica de Ganchos Hipnóticos/i).length).toBeGreaterThan(0);
    expect(within(modal).getAllByText(/Carrossel Viral de 10 Slides/i).length).toBeGreaterThan(0);
    expect(within(modal).getAllByText(/VSL Beast Mode/i).length).toBeGreaterThan(0);
    expect(within(modal).getByText(/Disparar Acelerador/i)).toBeInTheDocument();
  });
});
