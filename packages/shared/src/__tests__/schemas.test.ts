import { describe, it, expect } from 'vitest';
import {
  DataTypeEnum,
  PortDefinitionSchema,
  NodeDefinitionSchema,
  ConnectionDefinitionSchema,
  WorkflowDefinitionSchema,
  DataPacketSchema
} from '../index.js';

describe('Shared Domain Schemas', () => {
  it('should validate universal DataTypeEnum values', () => {
    const validTypes = [
      'TEXT',
      'URL',
      'VIDEO',
      'IMAGE',
      'AUDIO',
      'DOCUMENT',
      'JSON',
      'TABLE',
      'TRANSCRIPT',
      'METADATA',
      'AI_RESPONSE'
    ];

    validTypes.forEach((type) => {
      expect(DataTypeEnum.parse(type)).toBe(type);
    });

    expect(() => DataTypeEnum.parse('INVALID_TYPE')).toThrow();
  });

  it('should validate PortDefinitionSchema correctly', () => {
    const validPort = {
      id: 'port-1',
      name: 'prompt',
      label: 'Prompt Input',
      type: 'TEXT',
      isMulti: false,
      required: true
    };

    const parsed = PortDefinitionSchema.parse(validPort);
    expect(parsed.name).toBe('prompt');
    expect(parsed.type).toBe('TEXT');
  });

  it('should validate NodeDefinitionSchema with ports and initial state', () => {
    const validNode = {
      id: 'node-1',
      type: 'ai-chat',
      label: 'AI Chat Assistant',
      category: 'AI',
      position: { x: 100, y: 200 },
      inputs: [
        {
          id: 'in-1',
          name: 'prompt',
          label: 'User Prompt',
          type: 'TEXT',
          isMulti: false,
          required: true
        }
      ],
      outputs: [
        {
          id: 'out-1',
          name: 'response',
          label: 'AI Response',
          type: 'AI_RESPONSE',
          isMulti: true,
          required: true
        }
      ],
      config: { model: 'gpt-4o', temperature: 0.7 },
      state: 'IDLE'
    };

    const parsed = NodeDefinitionSchema.parse(validNode);
    expect(parsed.id).toBe('node-1');
    expect(parsed.state).toBe('IDLE');
    expect(parsed.inputs.length).toBe(1);
    expect(parsed.outputs.length).toBe(1);
  });

  it('should validate ConnectionDefinitionSchema with real data attributes', () => {
    const validConnection = {
      id: 'conn-1',
      sourceNodeId: 'node-1',
      sourcePortId: 'out-1',
      targetNodeId: 'node-2',
      targetPortId: 'in-1',
      state: 'connected'
    };

    const parsed = ConnectionDefinitionSchema.parse(validConnection);
    expect(parsed.id).toBe('conn-1');
    expect(parsed.state).toBe('connected');
  });

  it('should validate DataPacketSchema payload and metadata', () => {
    const packet = {
      id: 'pkt-1',
      type: 'TEXT',
      payload: 'Conteúdo transcrito de vídeo do YouTube',
      metadata: {
        sizeBytes: 40,
        timestamp: Date.now(),
        tokens: 12,
        processingTimeMs: 150,
        creditsCost: 0.05
      }
    };

    const parsed = DataPacketSchema.parse(packet);
    expect(parsed.id).toBe('pkt-1');
    expect(parsed.metadata.sizeBytes).toBe(40);
  });

  it('should validate WorkflowDefinitionSchema', () => {
    const workflow = {
      id: 'wf-1',
      name: 'YouTube to Content Workflow',
      description: 'Extrai transcrição e gera posts para Instagram e YouTube',
      nodes: [],
      connections: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const parsed = WorkflowDefinitionSchema.parse(workflow);
    expect(parsed.name).toBe('YouTube to Content Workflow');
    expect(parsed.version).toBe(1);
  });
});
