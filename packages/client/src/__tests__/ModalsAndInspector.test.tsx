import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store/canvasStore.js';
import { CompatibilityModal } from '../components/modals/CompatibilityModal.js';
import { DataInspectorModal } from '../components/inspector/DataInspectorModal.js';
import { globalDataBus } from '@union/shared';

describe('Gate 5: CompatibilityModal & DataInspectorModal UI Components', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
    globalDataBus.clear();
  });

  it('CompatibilityModal should render when incompatible connection is pending and handle auto-insert', async () => {
    // Set pending proposal in store before render
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'src-1',
            position: { x: 50, y: 50 },
            data: { label: 'Video Source' }
          },
          {
            id: 'tgt-1',
            position: { x: 450, y: 50 },
            data: { label: 'AI Writer' }
          }
        ],
        pendingIncompatibleConnection: {
          connection: {
            source: 'src-1',
            sourceHandle: 'out-video',
            target: 'tgt-1',
            targetHandle: 'in-text'
          },
          sourceType: 'VIDEO',
          targetType: 'TEXT',
          sourceNodeLabel: 'Video Source',
          targetNodeLabel: 'AI Writer',
          suggestions: [
            {
              transformerNodeType: 'extractor-transcript',
              label: 'Extract Transcript',
              description: 'Extract transcription from video into structured text'
            }
          ]
        }
      });
    });

    render(<CompatibilityModal />);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Incompatible Data Types')).toBeDefined();
    expect(screen.getByText('BLOCKED')).toBeDefined();
    expect(screen.getByText('Extract Transcript')).toBeDefined();

    // Click Auto-Insert
    const autoInsertBtn = screen.getByRole('button', { name: /auto-insert/i });
    act(() => {
      fireEvent.click(autoInsertBtn);
    });

    // Store updated: modal closed and nodes wired
    expect(useCanvasStore.getState().pendingIncompatibleConnection).toBeNull();
    expect(useCanvasStore.getState().nodes.length).toBe(3);
    expect(useCanvasStore.getState().edges.length).toBe(2);
  });

  it('DataInspectorModal should render input summary, execution telemetry, and allow test injection', () => {
    // Setup nodes & edge
    const edgeId = 'edge-inspect-ui-1';
    act(() => {
      useCanvasStore.setState({
        nodes: [
          { id: 'n-src', position: { x: 0, y: 0 }, data: { label: 'YouTube Source' } },
          { id: 'n-tgt', position: { x: 300, y: 0 }, data: { label: 'Transcript Extractor' } }
        ],
        edges: [
          {
            id: edgeId,
            source: 'n-src',
            sourceHandle: 'out-vid',
            target: 'n-tgt',
            targetHandle: 'in-media',
            data: {
              dataType: 'VIDEO',
              state: 'connected'
            }
          }
        ],
        inspectedConnectionId: edgeId
      });
    });

    render(<DataInspectorModal />);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Data Bus Inspector')).toBeDefined();
    expect(screen.getByText('Input Summary')).toBeDefined();
    expect(screen.getByText('Execution Telemetry')).toBeDefined();
    expect(screen.getByText('VIDEO')).toBeDefined();

    // Inject test packet
    const injectBtn = screen.getByRole('button', { name: /inject test packet/i });
    act(() => {
      fireEvent.click(injectBtn);
    });

    // Edge updated
    const updatedEdge = useCanvasStore.getState().edges.find((e) => e.id === edgeId);
    expect(updatedEdge?.data?.state).toBe('completed');

    // Close button
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    expect(closeButtons.length).toBeGreaterThan(0);
    act(() => {
      fireEvent.click(closeButtons[0]);
    });
    expect(useCanvasStore.getState().inspectedConnectionId).toBeNull();
  });
});
