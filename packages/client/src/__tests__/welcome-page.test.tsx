import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeModal } from '../components/welcome/WelcomeModal.js';
import { useCanvasStore } from '../store/canvasStore.js';

describe('WelcomeModal - High Converting Showcase Experience', () => {
  beforeEach(() => {
    localStorage.clear();
    useCanvasStore.getState().resetCanvas();
    vi.clearAllMocks();
  });

  it('renders correctly when open with initial Overview tab', () => {
    render(<WelcomeModal isOpen={true} onClose={() => {}} />);

    // Header title and subtitle
    expect(screen.getByText('UNION.AI 2.0')).toBeDefined();
    expect(screen.getByText(/A Bancada Visual de Inteligência Artificial & Engenharia de Dados/i)).toBeDefined();

    // Key metrics banner
    expect(screen.getByText('235 Testes')).toBeDefined();
    expect(screen.getByText('< 3 Segundos')).toBeDefined();
    expect(screen.getByText('Até 85%')).toBeDefined();
    expect(screen.getByText('Multi-Provedor')).toBeDefined();

    // Tab buttons
    expect(screen.getByRole('button', { name: /Visão Geral/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /As 4 Superpotências/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Templates de Escala/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Arquitetura do Fluxo/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Início em 3 Passos/i })).toBeDefined();

    // Overview content
    expect(screen.getByText(/Transforme Dados Reais em Funis Completos de Vendas em Menos de 3 Minutos/i)).toBeDefined();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<WelcomeModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('allows navigating between all 5 knowledge tabs', () => {
    render(<WelcomeModal isOpen={true} onClose={() => {}} />);

    // Switch to Superpotencias
    fireEvent.click(screen.getByRole('button', { name: /As 4 Superpotências/i }));
    expect(screen.getByText('Orquestração Multi-Modelos')).toBeDefined();
    expect(screen.getByText('UNION Data Bus Tipado')).toBeDefined();
    expect(screen.getByText('Extratores de Dados Reais')).toBeDefined();
    expect(screen.getByText('Motores de Alta Conversão')).toBeDefined();

    // Switch to Templates
    fireEvent.click(screen.getByRole('button', { name: /Templates de Escala/i }));
    expect(screen.getByText('Full Funnel Launch Machine')).toBeDefined();
    expect(screen.getByText('YouTube Content Factory')).toBeDefined();
    expect(screen.getByText('Competitor Intelligence Matrix')).toBeDefined();
    expect(screen.getByText('Autonomous Marketing VSL Engine')).toBeDefined();

    // Switch to Arquitetura
    fireEvent.click(screen.getByRole('button', { name: /Arquitetura do Fluxo/i }));
    expect(screen.getByText('Como Funciona o Ciclo de Execução em Grafo')).toBeDefined();
    expect(screen.getByText('Garantias de Execução Enterprise')).toBeDefined();

    // Switch to Inicio em 3 passos
    fireEvent.click(screen.getByRole('button', { name: /Início em 3 Passos/i }));
    expect(screen.getByText('Adicione seus Nós de Entrada')).toBeDefined();
    expect(screen.getByText('Conecte as Portas Coloridas com o Mouse')).toBeDefined();
    expect(screen.getByText('Clique em "RUN WORKFLOW"')).toBeDefined();
  });

  it('instantiates an official template into the canvas store with 1-click', () => {
    const onClose = vi.fn();
    render(<WelcomeModal isOpen={true} onClose={onClose} />);

    // Switch to templates tab
    fireEvent.click(screen.getByRole('button', { name: /Templates de Escala/i }));

    // Click on Full Funnel Launch Machine template
    const launchBtn = screen.getByTestId('template-launch-full-funnel-launch-machine');
    expect(launchBtn).toBeDefined();
    fireEvent.click(launchBtn);

    // Verify canvas store updated with template nodes and edges
    const state = useCanvasStore.getState();
    expect(state.nodes.length).toBeGreaterThanOrEqual(4);
    expect(state.edges.length).toBeGreaterThanOrEqual(3);
    expect(state.workflowName).toBe('Full Funnel Launch Machine');
    expect(onClose).toHaveBeenCalled();
  });

  it('handles remember dismissal toggle in localStorage', () => {
    render(<WelcomeModal isOpen={true} onClose={() => {}} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDefined();
    expect((checkbox as HTMLInputElement).checked).toBe(false);

    // Check the box
    fireEvent.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(true);
    expect(localStorage.getItem('union_welcome_dismissed')).toBe('true');

    // Uncheck the box (removes item)
    fireEvent.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(false);
    expect(localStorage.getItem('union_welcome_dismissed')).toBeNull();
  });

  it('calls onClose when close button or CTA button is clicked', () => {
    const onClose = vi.fn();
    render(<WelcomeModal isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByTitle(/Fechar apresentação/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const canvasBtn = screen.getByRole('button', { name: /Ir para o Canvas/i });
    fireEvent.click(canvasBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
