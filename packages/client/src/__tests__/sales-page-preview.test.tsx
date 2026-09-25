import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesPageLivePreviewModal } from '../components/modals/SalesPageLivePreviewModal.js';
import type { SalesPageCopy } from '@union/shared';

const mockCopy: SalesPageCopy = {
  title: 'Transforme Sua Vida em 30 Dias',
  headline: 'Transforme Sua Vida em 30 Dias',
  subheadline: 'O método comprovado para resultados reais',
  problem: 'Você está cansado de não conseguir resultados?',
  consequences: 'Perder tempo, perder dinheiro e sentir frustração contínua.',
  opportunity: 'Aprenda o método testado para alavancar seus resultados.',
  mechanism: 'Nosso método exclusivo de 3 passos',
  benefits: ['Resultado rápido', 'Método comprovado', 'Suporte total'],
  proof: ['Mais de 10.000 alunos satisfeitos'],
  offer: 'Curso Completo de R$ 997 por R$ 297',
  bonuses: ['Bônus 1: Templates Exclusivos', 'Bônus 2: Comunidade VIP'],
  guarantee: 'Garantia de 30 dias ou seu dinheiro de volta',
  objections: ['Não tenho tempo', 'É caro demais'],
  faq: [
    { question: 'Como funciona?', answer: 'É muito simples...' },
  ],
  cta: 'Quero Começar Agora'
};

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'test-token'),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SalesPageLivePreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        html: '<html><body><h1>Transforme Sua Vida em 30 Dias</h1></body></html>',
        title: 'Transforme Sua Vida em 30 Dias',
        sizeBytes: 1024,
      }),
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SalesPageLivePreviewModal
        isOpen={false}
        onClose={() => {}}
        copy={mockCopy}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', async () => {
    render(
      <SalesPageLivePreviewModal
        isOpen={true}
        onClose={() => {}}
        copy={mockCopy}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/HTML5 \+ Tailwind/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <SalesPageLivePreviewModal
        isOpen={true}
        onClose={onClose}
        copy={mockCopy}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/HTML5 \+ Tailwind/i)).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /fechar|close|×/i });
    if (closeBtn) fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading state while fetching preview', () => {
    // Keep fetch pending
    mockFetch.mockReturnValue(new Promise(() => {}));

    render(
      <SalesPageLivePreviewModal
        isOpen={true}
        onClose={() => {}}
        copy={mockCopy}
      />
    );

    expect(screen.getByText(/Compilando os 14 blocos/i)).toBeInTheDocument();
  });
});
