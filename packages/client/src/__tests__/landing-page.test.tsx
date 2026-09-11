import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from '../components/landing/LandingPage.js';
import { useCanvasStore } from '../store/canvasStore.js';

describe('LandingPage - Modern High-Converting Experience', () => {
  beforeEach(() => {
    localStorage.clear();
    useCanvasStore.getState().resetCanvas();
    vi.clearAllMocks();
  });

  it('renders correctly with navbar, hero headline, and metrics strip', () => {
    render(
      <LandingPage
        serverStatus="online"
        onEnterWorkspace={() => {}}
      />
    );

    // Navbar Brand & Version (using getAllByText because brand appears in navbar and footer)
    expect(screen.getAllByText('UNION.AI').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('v2.0 Enterprise')).toBeDefined();
    expect(screen.getByText('Core Online')).toBeDefined();

    // Hero Headline & Sub-headline
    expect(screen.getByText(/Engenharia de Marketing & IA Visual em Escala/i)).toBeDefined();
    expect(screen.getByText(/Sem Copiar e Colar/i)).toBeDefined();

    // Metrics Strip
    expect(screen.getByText('235+')).toBeDefined();
    expect(screen.getByText('Testes Homologados')).toBeDefined();
    expect(screen.getByText('< 3s')).toBeDefined();
    expect(screen.getByText('85%')).toBeDefined();
  });

  it('transitions to workspace when clicking Abrir Workspace or CTA buttons', () => {
    const onEnterWorkspace = vi.fn();
    render(
      <LandingPage
        serverStatus="online"
        onEnterWorkspace={onEnterWorkspace}
      />
    );

    const openWorkspaceBtns = screen.getAllByRole('button', { name: /Abrir Workspace/i });
    fireEvent.click(openWorkspaceBtns[0]);
    expect(onEnterWorkspace).toHaveBeenCalledTimes(1);

    const startFreeBtn = screen.getByRole('button', { name: /Começar Agora com 100 Créditos Grátis/i });
    fireEvent.click(startFreeBtn);
    expect(onEnterWorkspace).toHaveBeenCalledTimes(2);
  });

  it('switches between templates in the interactive showcase and loads into canvas store', () => {
    const onEnterWorkspace = vi.fn();
    render(
      <LandingPage
        serverStatus="online"
        onEnterWorkspace={onEnterWorkspace}
      />
    );

    // Click on YouTube Content Factory template card
    const ytTemplateCard = screen.getByText('YouTube Content Factory');
    fireEvent.click(ytTemplateCard);

    // Check preview updated (could match card and preview box)
    expect(screen.getAllByText(/Transforma qualquer vídeo ou podcast do YouTube/i).length).toBeGreaterThanOrEqual(1);

    // Click load template button
    const loadBtn = screen.getByTestId('landing-launch-template');
    fireEvent.click(loadBtn);

    // Verify canvasStore updated
    const state = useCanvasStore.getState();
    expect(state.nodes.length).toBeGreaterThan(0);
    expect(state.workflowName).toBe('YouTube Content Factory');
    expect(onEnterWorkspace).toHaveBeenCalled();
  });

  it('toggles FAQ accordion items', () => {
    render(
      <LandingPage
        serverStatus="online"
        onEnterWorkspace={() => {}}
      />
    );

    // First question should be open by default
    expect(screen.getByText(/Nos chats convencionais, o trabalho é linear e isolado/i)).toBeDefined();

    // Click on second question: UNION Data Bus
    const secondQ = screen.getByText(/Como funciona o barramento de dados tipado \(UNION Data Bus\)\?/i);
    fireEvent.click(secondQ);

    expect(screen.getByText(/Cada nó possui portas de entrada e saída com tipos estritos/i)).toBeDefined();
  });

  it('toggles billing cycle between annual and monthly', () => {
    render(
      <LandingPage
        serverStatus="online"
        onEnterWorkspace={() => {}}
      />
    );

    // Default is annual with discount
    expect(screen.getByText('R$ 79')).toBeDefined();
    expect(screen.getByText('R$ 199')).toBeDefined();

    // Switch to monthly
    const monthlyBtn = screen.getByRole('button', { name: 'Mensal' });
    fireEvent.click(monthlyBtn);

    expect(screen.getByText('R$ 99')).toBeDefined();
    expect(screen.getByText('R$ 249')).toBeDefined();
  });
});
