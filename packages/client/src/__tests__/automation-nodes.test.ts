import { describe, it, expect, beforeEach } from 'vitest';
import { NODE_TEMPLATES, createNodeFromTemplate } from '../components/nodes/nodeRegistry.js';
import { useCanvasStore } from '../store/canvasStore.js';
import { defaultNodeHandler, createDataPacket } from '@union/shared';

describe('Gate 15: Automations & Autonomous Agents Nodes on Client', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
  });

  describe('Node Registry Templates', () => {
    it('registers trigger-webhook template with expected ports and config', () => {
      const template = NODE_TEMPLATES['trigger-webhook'];
      expect(template).toBeDefined();
      expect(template.category).toBe('SOURCE');
      expect(template.label).toContain('Webhook');

      const outData = template.outputs.find(o => o.id === 'out-data');
      expect(outData).toBeDefined();
      expect(outData?.type).toBe('JSON');
    });

    it('registers trigger-schedule template with cron configuration', () => {
      const template = NODE_TEMPLATES['trigger-schedule'];
      expect(template).toBeDefined();
      expect(template.category).toBe('SOURCE');
      expect(template.defaultConfig.cronExpression).toBe('0 9 * * *');

      const outTick = template.outputs.find(o => o.id === 'out-tick');
      expect(outTick).toBeDefined();
      expect(outTick?.type).toBe('METADATA');
    });

    it('registers flow-loop template with anti-infinite loop guard rail', () => {
      const template = NODE_TEMPLATES['flow-loop'];
      expect(template).toBeDefined();
      expect(template.category).toBe('TRANSFORM');
      expect(template.defaultConfig.maxIterations).toBe(10);

      const inItems = template.inputs.find(i => i.id === 'in-items');
      expect(inItems).toBeDefined();
      expect(inItems?.type).toBe('JSON');

      const outItem = template.outputs.find(o => o.id === 'out-item');
      expect(outItem).toBeDefined();
      expect(outItem?.type).toBe('JSON');
    });

    it('registers ai-agent-autonomous template with ReAct reflection support', () => {
      const template = NODE_TEMPLATES['ai-agent-autonomous'];
      expect(template).toBeDefined();
      expect(template.category).toBe('AI');
      expect(template.defaultConfig.reflectionEnabled).toBe(true);

      const outResult = template.outputs.find(o => o.id === 'out-result');
      expect(outResult).toBeDefined();
      expect(outResult?.type).toBe('AI_RESPONSE');

      const outLogs = template.outputs.find(o => o.id === 'out-logs');
      expect(outLogs).toBeDefined();
      expect(outLogs?.type).toBe('JSON');
    });
  });

  describe('Canvas Store Integration', () => {
    it('instantiates and adds all 4 automation nodes to canvas', () => {
      const automationTypes = [
        'trigger-webhook',
        'trigger-schedule',
        'flow-loop',
        'ai-agent-autonomous'
      ];

      automationTypes.forEach((type, idx) => {
        const nodeDef = createNodeFromTemplate(type, { x: 50 * idx, y: 50 * idx });
        expect(nodeDef.id).toContain(`node-${type}`);

        useCanvasStore.getState().addNode({
          id: nodeDef.id,
          type: 'unionNode',
          position: nodeDef.position,
          data: nodeDef as unknown as Record<string, unknown>
        });
      });

      expect(useCanvasStore.getState().nodes.length).toBe(4);
    });
  });

  describe('Execution Engine Synthesizer for Automation Nodes', () => {
    const controller = new AbortController();

    it('synthesizes trigger-webhook payload correctly', async () => {
      const nodeDef = createNodeFromTemplate('trigger-webhook');
      nodeDef.config = { webhookPayload: { orderId: 'ord-123', value: 99.90 } };

      const result = await defaultNodeHandler(nodeDef, {}, controller.signal);
      expect(result.outputs['out-data']).toBeDefined();
      expect(result.outputs['out-data'].type).toBe('JSON');
      expect((result.outputs['out-data'].payload as Record<string, unknown>).orderId).toBe('ord-123');
    });

    it('synthesizes trigger-schedule cron tick', async () => {
      const nodeDef = createNodeFromTemplate('trigger-schedule');
      const result = await defaultNodeHandler(nodeDef, {}, controller.signal);

      expect(result.outputs['out-tick']).toBeDefined();
      expect(result.outputs['out-tick'].type).toBe('METADATA');
      expect((result.outputs['out-tick'].payload as Record<string, unknown>).type).toBe('SCHEDULE_TICK');
    });

    it('synthesizes flow-loop item extraction', async () => {
      const nodeDef = createNodeFromTemplate('flow-loop');
      const mockInputs = {
        'in-items': createDataPacket({
          type: 'JSON',
          payload: ['Campanha A', 'Campanha B', 'Campanha C'],
          originNodeId: 'node-0',
          originPortId: 'out-0'
        })
      };

      const result = await defaultNodeHandler(nodeDef, mockInputs, controller.signal);
      expect(result.outputs['out-item']).toBeDefined();
      expect(result.outputs['out-item'].payload).toBe('Campanha A');
      expect(result.outputs['out-accumulated'].payload).toEqual(['Campanha A', 'Campanha B', 'Campanha C']);
    });

    it('synthesizes ai-agent-autonomous solution with multi-step ReAct log', async () => {
      const nodeDef = createNodeFromTemplate('ai-agent-autonomous');
      nodeDef.config = { agentGoal: 'Otimizar CTR de anúncios do Meta' };

      const result = await defaultNodeHandler(nodeDef, {}, controller.signal);
      expect(result.tokens).toBeGreaterThan(500);
      expect(result.credits).toBeGreaterThan(0.03);

      expect(result.outputs['out-result']).toBeDefined();
      expect(result.outputs['out-result'].type).toBe('AI_RESPONSE');
      expect(typeof result.outputs['out-result'].payload).toBe('string');
      expect((result.outputs['out-result'].payload as string)).toContain('AGENTE AUTÔNOMO ReAct');

      expect(result.outputs['out-logs']).toBeDefined();
      expect(result.outputs['out-logs'].type).toBe('JSON');
      expect(Array.isArray(result.outputs['out-logs'].payload)).toBe(true);
    });
  });
});
