import { describe, it, expect, beforeEach } from 'vitest';
import { NODE_TEMPLATES, createNodeFromTemplate } from '../components/nodes/nodeRegistry.js';
import { useCanvasStore } from '../store/canvasStore.js';
import { defaultNodeHandler } from '@union/shared';

describe('Gate 14: Marketing Intelligence Nodes & Canvas Integration', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
  });

  describe('Node Registry Templates', () => {
    it('registers marketing-avatar template with UNDERSTAND category and required ports', () => {
      const template = NODE_TEMPLATES['marketing-avatar'];
      expect(template).toBeDefined();
      expect(template.category).toBe('UNDERSTAND');
      expect(template.label).toContain('Marketing Avatar');
      
      const outAvatar = template.outputs.find(o => o.id === 'out-avatar');
      const outDossier = template.outputs.find(o => o.id === 'out-dossier');
      expect(outAvatar).toBeDefined();
      expect(outAvatar?.type).toBe('JSON');
      expect(outDossier).toBeDefined();
      expect(outDossier?.type).toBe('DOCUMENT');
    });

    it('registers marketing-competitor template with SWOT and analysis outputs', () => {
      const template = NODE_TEMPLATES['marketing-competitor'];
      expect(template).toBeDefined();
      expect(template.category).toBe('UNDERSTAND');
      
      const outAnalysis = template.outputs.find(o => o.id === 'out-analysis');
      const outSwot = template.outputs.find(o => o.id === 'out-swot');
      expect(outAnalysis).toBeDefined();
      expect(outAnalysis?.type).toBe('JSON');
      expect(outSwot).toBeDefined();
      expect(outSwot?.type).toBe('TABLE');
    });

    it('registers marketing-vsl template with 12-step VSL script outputs', () => {
      const template = NODE_TEMPLATES['marketing-vsl'];
      expect(template).toBeDefined();
      expect(template.category).toBe('AI');
      
      const outVsl = template.outputs.find(o => o.id === 'out-vsl');
      const outHook = template.outputs.find(o => o.id === 'out-hook');
      expect(outVsl).toBeDefined();
      expect(outVsl?.type).toBe('DOCUMENT');
      expect(outHook).toBeDefined();
      expect(outHook?.type).toBe('TEXT');
    });

    it('registers marketing-ads template with multi-platform creative matrix', () => {
      const template = NODE_TEMPLATES['marketing-ads'];
      expect(template).toBeDefined();
      expect(template.category).toBe('AI');
      
      const outAds = template.outputs.find(o => o.id === 'out-ads');
      const outCopy = template.outputs.find(o => o.id === 'out-copy');
      expect(outAds).toBeDefined();
      expect(outAds?.type).toBe('JSON');
      expect(outCopy).toBeDefined();
      expect(outCopy?.type).toBe('DOCUMENT');
    });
  });

  describe('Node Instantiation & Canvas Store Integration', () => {
    it('creates and adds marketing nodes to canvas store with initial state IDLE', () => {
      const marketingTypes = [
        'marketing-avatar',
        'marketing-competitor',
        'marketing-vsl',
        'marketing-ads'
      ];

      marketingTypes.forEach((type, idx) => {
        const nodeDef = createNodeFromTemplate(type, { x: 100 * idx, y: 100 * idx });
        expect(nodeDef.id).toContain(`node-${type}`);
        expect(nodeDef.state).toBe('IDLE');

        useCanvasStore.getState().addNode({
          id: nodeDef.id,
          type: 'unionNode',
          position: nodeDef.position,
          data: nodeDef as unknown as Record<string, unknown>
        });
      });

      const nodes = useCanvasStore.getState().nodes;
      expect(nodes.length).toBe(4);
    });
  });

  describe('Execution Engine Marketing Node Synthesizer', () => {
    const controller = new AbortController();

    it('synthesizes structured Avatar profile and dossier', async () => {
      const nodeDef = createNodeFromTemplate('marketing-avatar');
      const result = await defaultNodeHandler(nodeDef, {}, controller.signal);

      expect(result.tokens).toBeGreaterThan(100);
      expect(result.credits).toBeGreaterThan(0.01);
      expect(result.outputs['out-avatar']).toBeDefined();
      expect(result.outputs['out-avatar'].type).toBe('JSON');
      
      const avatar = result.outputs['out-avatar'].payload as Record<string, unknown>;
      expect(avatar.name).toBeDefined();
      expect(Array.isArray(avatar.pains)).toBe(true);
      expect(Array.isArray(avatar.desires)).toBe(true);

      expect(result.outputs['out-dossier']).toBeDefined();
      expect(typeof result.outputs['out-dossier'].payload).toBe('string');
      expect(result.outputs['out-dossier'].payload as string).toContain('Dossier do Avatar');
    });

    it('synthesizes structured Competitor SWOT and Analysis', async () => {
      const nodeDef = createNodeFromTemplate('marketing-competitor');
      const result = await defaultNodeHandler(nodeDef, {}, controller.signal);

      expect(result.outputs['out-analysis']).toBeDefined();
      const analysis = result.outputs['out-analysis'].payload as Record<string, unknown>;
      expect(analysis.competitorName).toBeDefined();
      expect(analysis.swot).toBeDefined();

      expect(result.outputs['out-swot']).toBeDefined();
      expect(result.outputs['out-swot'].type).toBe('TABLE');
      expect(Array.isArray(result.outputs['out-swot'].payload)).toBe(true);
    });

    it('synthesizes complete 12-Step VSL and golden hook', async () => {
      const nodeDef = createNodeFromTemplate('marketing-vsl');
      const result = await defaultNodeHandler(nodeDef, {}, controller.signal);

      expect(result.outputs['out-vsl']).toBeDefined();
      expect(result.outputs['out-vsl'].type).toBe('DOCUMENT');
      expect(typeof result.outputs['out-vsl'].payload).toBe('string');
      expect(result.outputs['out-vsl'].payload as string).toContain('Roteiro VSL');

      expect(result.outputs['out-hook']).toBeDefined();
      expect(typeof result.outputs['out-hook'].payload).toBe('string');
      expect((result.outputs['out-hook'].payload as string).length).toBeGreaterThan(10);
    });

    it('synthesizes multi-platform Ad Matrix with creatives', async () => {
      const nodeDef = createNodeFromTemplate('marketing-ads');
      const result = await defaultNodeHandler(nodeDef, {}, controller.signal);

      expect(result.outputs['out-ads']).toBeDefined();
      expect(result.outputs['out-ads'].type).toBe('JSON');
      const matrix = result.outputs['out-ads'].payload as { creatives: Array<{ platform: string; hook: string; callToAction: string }> };
      expect(matrix.creatives.length).toBeGreaterThanOrEqual(3);
      expect(matrix.creatives.some(c => c.platform === 'META_FEED')).toBe(true);

      expect(result.outputs['out-copy']).toBeDefined();
      expect(result.outputs['out-copy'].type).toBe('DOCUMENT');
    });
  });
});
