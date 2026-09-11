import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversionSimulatorModal } from '../components/marketing/ConversionSimulatorModal.js';
import { ProjectOracleDrawer } from '../components/chat/ProjectOracleDrawer.js';
import { NODE_TEMPLATES } from '../components/nodes/nodeRegistry.js';

describe('Exclusive Feature & Project Oracle UI Tests', () => {
  describe('Node Registry Integration', () => {
    it('registers the ai-conversion-simulator node template correctly', () => {
      const template = NODE_TEMPLATES['ai-conversion-simulator'];
      expect(template).toBeDefined();
      expect(template.label).toBe('AI Conversion Simulator & Heatmap');
      expect(template.category).toBe('AI');
      expect(template.outputs.some(o => o.id === 'out-simulation')).toBe(true);
      expect(template.outputs.some(o => o.id === 'out-healed')).toBe(true);
    });
  });

  describe('ConversionSimulatorModal', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <ConversionSimulatorModal isOpen={false} onClose={() => {}} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders the 5 synthetic personas and CPS score when open', () => {
      render(
        <ConversionSimulatorModal isOpen={true} onClose={() => {}} />
      );

      expect(screen.getByText(/AI Conversion Simulator & Heatmap Visualizer/i)).toBeDefined();
      expect(screen.getByText(/Chave de Ouro/i)).toBeDefined();
      expect(screen.getByText(/Conversion Probability Score \(CPS\)/i)).toBeDefined();
      expect(screen.getAllByText(/Dr. Roberto Meirelles/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Ana Lívia Siqueira/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Carlos Mendes/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Mariana Costa/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Lucas Rocha/i).length).toBeGreaterThanOrEqual(1);
    });

    it('displays Drop-Off warning and 1-Click Auto-Heal button', () => {
      render(
        <ConversionSimulatorModal isOpen={true} onClose={() => {}} />
      );

      expect(screen.getByText(/DROP-OFF \(Abandono Crítico\)/i)).toBeDefined();
      expect(screen.getByText(/1-Click Auto-Heal/i)).toBeDefined();
    });
  });

  describe('ProjectOracleDrawer', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <ProjectOracleDrawer isOpen={false} onClose={() => {}} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders the deep knowledge header, quick suggestions, and welcome message', () => {
      render(
        <ProjectOracleDrawer isOpen={true} onClose={() => {}} />
      );

      expect(screen.getAllByText(/UNION.AI Project Oracle/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Deep Knowledge/i)).toBeDefined();
      expect(screen.getByText(/Como funciona o Data Bus e o DataPacket\?/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/Pergunte qualquer coisa sobre o UNION.AI/i)).toBeDefined();
    });

    it('calls onClose when clicking close button', () => {
      const handleClose = vi.fn();
      render(
        <ProjectOracleDrawer isOpen={true} onClose={handleClose} />
      );

      const closeBtn = screen.getAllByRole('button')[0];
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
