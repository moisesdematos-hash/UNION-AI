import { describe, it, expect } from 'vitest';
import {
  DataBus,
  createDataPacket,
  calculatePayloadSizeBytes,
  ConnectionInspectionSchema
} from '../index.js';

describe('UNION Data Bus Engine', () => {
  it('should accurately calculate payload byte size for different data formats', () => {
    expect(calculatePayloadSizeBytes('')).toBe(0);
    expect(calculatePayloadSizeBytes(null)).toBe(0);
    expect(calculatePayloadSizeBytes(undefined)).toBe(0);
    expect(calculatePayloadSizeBytes('Hello UNION.AI')).toBe(14);

    const jsonPayload = { title: 'Marketing Strategy', views: 1500 };
    const expectedSize = new TextEncoder().encode(JSON.stringify(jsonPayload)).length;
    expect(calculatePayloadSizeBytes(jsonPayload)).toBe(expectedSize);
  });

  it('should create valid DataPackets adhering to DataPacketSchema', () => {
    const packet = createDataPacket({
      type: 'TEXT',
      payload: 'Generated Marketing Video Script',
      originNodeId: 'ai-writer-1',
      originPortId: 'out-text',
      tokens: 350,
      processingTimeMs: 420,
      creditsCost: 0.05,
      provider: 'openai',
      model: 'gpt-4o'
    });

    expect(packet.id).toMatch(/^pkt_\d+_/);
    expect(packet.type).toBe('TEXT');
    expect(packet.payload).toBe('Generated Marketing Video Script');
    expect(packet.metadata.sizeBytes).toBeGreaterThan(0);
    expect(packet.metadata.tokens).toBe(350);
    expect(packet.metadata.processingTimeMs).toBe(420);
    expect(packet.metadata.creditsCost).toBe(0.05);
    expect(packet.metadata.model).toBe('gpt-4o');
  });

  it('should publish, retrieve, and dispatch packets to subscribers', () => {
    const bus = new DataBus();
    const connectionId = 'conn_source_to_target_1';

    let receivedPacket: any = null;
    const unsubscribe = bus.subscribe(connectionId, (packet) => {
      receivedPacket = packet;
    });

    const packet = createDataPacket({
      type: 'TRANSCRIPT',
      payload: 'Full transcribed text from video',
      originNodeId: 'node-youtube-1'
    });

    bus.publish(connectionId, packet);

    expect(bus.getPacket(connectionId)).toEqual(packet);
    expect(receivedPacket).toEqual(packet);

    // Test unsubscribe
    unsubscribe();
    bus.publish(connectionId, { ...packet, id: 'pkt-2' });
    // receivedPacket should still be the old one
    expect(receivedPacket.id).toBe(packet.id);
  });

  it('should generate valid ConnectionInspection with input and output summaries', () => {
    const bus = new DataBus();
    const connectionId = 'edge-inspect-test-1';

    const packet = createDataPacket({
      type: 'JSON',
      payload: { leads: ['Ana', 'Carlos'], count: 2 },
      originNodeId: 'extractor-data-1',
      tokens: 120,
      processingTimeMs: 85,
      creditsCost: 0.01
    });

    bus.publish(connectionId, packet);

    const inspection = bus.inspectConnection({
      connectionId,
      sourceNodeId: 'extractor-data-1',
      sourcePortId: 'out-json',
      targetNodeId: 'ai-analyst-1',
      targetPortId: 'in-data',
      status: 'completed'
    });

    // Validate with Zod schema
    const validated = ConnectionInspectionSchema.parse(inspection);
    expect(validated.connectionId).toBe(connectionId);
    expect(validated.inputSummary.type).toBe('JSON');
    expect(validated.inputSummary.sizeBytes).toBeGreaterThan(0);
    expect(validated.inputSummary.origin).toBe('extractor-data-1');
    expect(validated.outputSummary.status).toBe('completed');
    expect(validated.outputSummary.tokens).toBe(120);
    expect(validated.outputSummary.processingTimeMs).toBe(85);
    expect(validated.outputSummary.credits).toBe(0.01);
  });

  it('should clear stored packets and subscribers cleanly', () => {
    const bus = new DataBus();
    const packet = createDataPacket({ type: 'TEXT', payload: 'test' });
    bus.publish('conn-1', packet);

    expect(bus.getAllPackets().size).toBe(1);
    bus.clear();
    expect(bus.getAllPackets().size).toBe(0);
    expect(bus.getPacket('conn-1')).toBeUndefined();
  });
});
