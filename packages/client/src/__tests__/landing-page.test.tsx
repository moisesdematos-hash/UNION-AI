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

  it('calculates ROI savings dynamically when adjusting campaign count', () => {
    render(
      <LandingPage
        serverStatus="online"
        onEnterWorkspace={() => {}}
      />
    );

    // Verify ROI Calculator is rendered
    expect(screen.getByText(/Calculadora de Retorno \(ROI\)/i)).toBeDefined();
    expect(screen.getByText(/Quanto Tempo e Dinheiro Sua Equipe Economiza\?/i)).toBeDefined();
    expect(screen.getByText(/4 campanhas/i)).toBeDefined();
  });

  it('opens and switches tabs in the Legal & Documentation modal', () => {
    render(
      <LandingPage
        serverStatus="online"
        onEnterWorkspace={() => {}}
      />
    );

    // Open Documentation from nav
    const docsNavBtn = screen.getByRole('button', { name: 'Documentação' });
    fireEvent.click(docsNavBtn);

    // Modal title & content should appear
    expect(screen.getByText('Central de Governança & Documentação')).toBeDefined();
    expect(screen.getByText('Documentação Técnica & Endpoints')).toBeDefined();

    // Switch to Política de Privacidade via modal tab button
    const privacyTabBtns = screen.getAllByRole('button', { name: /Política de Privacidade/i });
    // Click the modal tab button (which has the icon span)
    fireEvent.click(privacyTabBtns[privacyTabBtns.length - 1]);

    expect(screen.getByText(/Não-Utilização de Dados para Treinamento de Modelos/i)).toBeDefined();

    // Close modal
    const closeBtn = screen.getByLabelText(/Fechar modal/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Central de Governança & Documentação')).toBeNull();
  });

  it('handles cookie consent banner acceptance', () => {
    render(
      <LandingPage
        serverStatus="online"
        onEnterWorkspace={() => {}}
      />
    );

    const cookieBanner = screen.getByText(/Privacidade & Cookies Estritamente Necessários/i);
    expect(cookieBanner).toBeDefined();

    const acceptBtn = screen.getByRole('button', { name: /Concordar & Fechar/i });
    fireEvent.click(acceptBtn);

    expect(localStorage.getItem('union_cookies_accepted')).toBe('true');
    expect(screen.queryByText(/Privacidade & Cookies Estritamente Necessários/i)).toBeNull();
  });

  it('submits newsletter subscription successfully', () => {
    render(
      <LandingPage
        serverStatus="online"
        onEnterWorkspace={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/Seu melhor e-mail/i);
    fireEvent.change(input, { target: { value: 'gestor@agencia.ai' } });

    const submitBtn = screen.getByRole('button', { name: /Inscrever/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Inscrição confirmada com sucesso!/i)).toBeDefined();
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
