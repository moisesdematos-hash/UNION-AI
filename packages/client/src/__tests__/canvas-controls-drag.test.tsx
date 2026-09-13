/**
 * @vitest-environment jsdom
 */
import './setup.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CanvasControls } from '../components/canvas/CanvasControls.js';
import { ReactFlowProvider } from '@xyflow/react';

describe('Draggable CanvasControls Toolbar', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders toolbar with grip handle and action buttons', () => {
    render(
      <ReactFlowProvider>
        <CanvasControls />
      </ReactFlowProvider>
    );

    const gripHandle = screen.getByTitle(/Arrastar barra de ferramentas/i);
    expect(gripHandle).toBeInTheDocument();
    expect(screen.getByTitle(/Undo/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Redo/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Zoom In/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Zoom Out/i)).toBeInTheDocument();
  });

  it('handles drag interactions and allows double-click reset to default position', () => {
    render(
      <ReactFlowProvider>
        <CanvasControls />
      </ReactFlowProvider>
    );

    const gripHandle = screen.getByTitle(/Arrastar barra de ferramentas/i);
    const toolbar = gripHandle.parentElement as HTMLElement;
    expect(toolbar).toBeInTheDocument();

    // Default position classes applied
    expect(toolbar.className).toContain('bottom-6 left-1/2 -translate-x-1/2');

    // Simulate pointer down on the drag handle
    fireEvent.pointerDown(gripHandle, {
      button: 0,
      clientX: 200,
      clientY: 500,
      pointerId: 1
    });

    // Simulate pointer move
    fireEvent.pointerMove(toolbar, {
      clientX: 350,
      clientY: 400,
      pointerId: 1
    });

    // Simulate pointer up
    fireEvent.pointerUp(toolbar, {
      pointerId: 1
    });

    // Verify double-click on grip handle resets position to null
    fireEvent.doubleClick(gripHandle);
    expect(toolbar.className).toContain('bottom-6 left-1/2 -translate-x-1/2');
  });
});
