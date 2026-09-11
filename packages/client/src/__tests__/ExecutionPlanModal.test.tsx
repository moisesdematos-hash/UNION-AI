import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store/canvasStore.js';
import { ExecutionPlanModal } from '../components/modals/ExecutionPlanModal.js';

describe('Gate 6: ExecutionPlanModal Component', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
  });

  it('should not render when modal is closed', () => {
    const { container } = render(<ExecutionPlanModal />);
    expect(container.firstChild).toBeNull();
  });

  it('should display validation blocking issues when workflow is invalid', () => {
    act(() => {
      useCanvasStore.setState({
        isExecutionPlanModalOpen: true,
        validationResult: {
          isValid: false,
          errors: [
            {
              code: 'MISSING_REQUIRED_INPUT',
              message: 'Input port media is required but has no incoming connection.',
              nodeId: 'node-ext-1',
              portId: 'in-media'
            }
          ],
          warnings: []
        },
        executionPlan: null
      });
    });

    render(<ExecutionPlanModal />);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Validation Failed')).toBeDefined();
    expect(screen.getByText('MISSING_REQUIRED_INPUT')).toBeDefined();
    expect(screen.getByText(/Input port media is required/i)).toBeDefined();
    expect(screen.queryByText(/Execute Workflow Plan/i)).toBeNull();
  });

  it('should display parallel stages and allow execution when DAG is valid', () => {
    act(() => {
      useCanvasStore.setState({
        isExecutionPlanModalOpen: true,
        nodes: [
          { id: 'src-1', position: { x: 0, y: 0 }, data: { label: 'YouTube Source', category: 'SOURCE' } },
          { id: 'src-2', position: { x: 0, y: 100 }, data: { label: 'Website Crawler', category: 'SOURCE' } },
          { id: 'ai-1', position: { x: 300, y: 50 }, data: { label: 'AI Analyst', category: 'AI' } }
        ],
        validationResult: {
          isValid: true,
          errors: [],
          warnings: []
        },
        executionPlan: {
          workflowId: 'wf-1',
          mode: 'RUN',
          totalNodes: 3,
          levels: [
            ['src-1', 'src-2'], // Stage 1 (Parallel)
            ['ai-1']            // Stage 2
          ],
          executionOrder: ['src-1', 'src-2', 'ai-1'],
          dependencies: { 'src-1': [], 'src-2': [], 'ai-1': ['src-1', 'src-2'] },
          dependents: { 'src-1': ['ai-1'], 'src-2': ['ai-1'], 'ai-1': [] }
        }
      });
    });

    render(<ExecutionPlanModal />);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('DAG Verified')).toBeDefined();
    expect(screen.getByText('Stage 1')).toBeDefined();
    expect(screen.getByText(/2 Nodes Running in Parallel/i)).toBeDefined();
    expect(screen.getByText('Stage 2')).toBeDefined();
    expect(screen.getByText(/1 Sequential Node/i)).toBeDefined();

    const executeBtn = screen.getByRole('button', { name: /execute workflow plan/i });
    expect(executeBtn).toBeDefined();

    // Close modal
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    expect(closeButtons.length).toBeGreaterThan(0);
    act(() => {
      fireEvent.click(closeButtons[0]);
    });
    expect(useCanvasStore.getState().isExecutionPlanModalOpen).toBe(false);
  });
});

