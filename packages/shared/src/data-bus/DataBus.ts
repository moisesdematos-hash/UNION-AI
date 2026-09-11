import {
  DataPacket,
  DataType,
  DataPacketMetadata,
  DataPacketSchema
} from '../types/data-types.js';
import {
  ConnectionInspection,
  ConnectionInspectionSchema
} from '../types/data-bus.js';

export interface CreateDataPacketOptions {
  type: DataType;
  payload: unknown;
  originNodeId?: string;
  originPortId?: string;
  tokens?: number;
  processingTimeMs?: number;
  creditsCost?: number;
  provider?: string;
  model?: string;
}

export interface InspectConnectionParams {
  connectionId: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  status?: string;
}

/**
 * Calculates byte size of any payload safely.
 */
export function calculatePayloadSizeBytes(payload: unknown): number {
  if (payload === undefined || payload === null) return 0;
  if (typeof payload === 'string') {
    return new TextEncoder().encode(payload).length;
  }
  try {
    const jsonStr = JSON.stringify(payload);
    return new TextEncoder().encode(jsonStr).length;
  } catch {
    return 0;
  }
}

/**
 * Factory to create valid DataPackets with auto-calculated size and timestamp.
 */
export function createDataPacket(options: CreateDataPacketOptions): DataPacket {
  const sizeBytes = calculatePayloadSizeBytes(options.payload);
  const metadata: DataPacketMetadata = {
    sizeBytes,
    timestamp: Date.now(),
    tokens: options.tokens,
    processingTimeMs: options.processingTimeMs,
    creditsCost: options.creditsCost,
    originNodeId: options.originNodeId,
    originPortId: options.originPortId,
    provider: options.provider,
    model: options.model
  };

  const id = `pkt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const packet: DataPacket = {
    id,
    type: options.type,
    payload: options.payload,
    metadata
  };

  // Validate packet schema
  return DataPacketSchema.parse(packet);
}

export type DataBusListener = (packet: DataPacket) => void;

/**
 * UNION Data Bus: In-memory reactive transport bus for node connections.
 */
export class DataBus {
  private packets: Map<string, DataPacket> = new Map();
  private subscribers: Map<string, Set<DataBusListener>> = new Map();

  /**
   * Publishes a data packet on a given connection ID.
   */
  public publish(connectionId: string, packet: DataPacket): void {
    // Validate packet
    DataPacketSchema.parse(packet);

    this.packets.set(connectionId, packet);

    const listeners = this.subscribers.get(connectionId);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(packet);
        } catch (err) {
          console.error(`[DataBus] Error in listener for connection ${connectionId}:`, err);
        }
      }
    }
  }

  /**
   * Retrieves the current or latest packet on a connection.
   */
  public getPacket(connectionId: string): DataPacket | undefined {
    return this.packets.get(connectionId);
  }

  /**
   * Retrieves all active packets mapped by connectionId.
   */
  public getAllPackets(): Map<string, DataPacket> {
    return new Map(this.packets);
  }

  /**
   * Subscribes to packets published on a specific connection ID.
   * Returns an unsubscribe function.
   */
  public subscribe(connectionId: string, listener: DataBusListener): () => void {
    if (!this.subscribers.has(connectionId)) {
      this.subscribers.set(connectionId, new Set());
    }
    this.subscribers.get(connectionId)!.add(listener);

    return () => {
      const set = this.subscribers.get(connectionId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.subscribers.delete(connectionId);
        }
      }
    };
  }

  /**
   * Builds a deep inspection object for a connection, combining packet metadata
   * and execution telemetry conforming to Section 29 of the specification.
   */
  public inspectConnection(
    params: InspectConnectionParams,
    defaultType: DataType = 'TEXT'
  ): ConnectionInspection {
    const packet = this.packets.get(params.connectionId);

    const dataType = packet?.type || defaultType;
    const sizeBytes = packet?.metadata.sizeBytes ?? 0;
    const timestamp = packet?.metadata.timestamp ?? Date.now();
    const origin = params.sourceNodeId;

    const preview = packet ? packet.payload : null;
    let quantity: number | undefined;
    if (Array.isArray(preview)) {
      quantity = preview.length;
    } else if (typeof preview === 'string') {
      quantity = preview.length;
    }

    const inspection: ConnectionInspection = {
      connectionId: params.connectionId,
      sourceNodeId: params.sourceNodeId,
      sourcePortId: params.sourcePortId,
      targetNodeId: params.targetNodeId,
      targetPortId: params.targetPortId,
      inputSummary: {
        type: dataType,
        sizeBytes,
        origin,
        timestamp
      },
      outputSummary: {
        dataPreview: preview,
        quantity,
        status: params.status || (packet ? 'completed' : 'connected'),
        processingTimeMs: packet?.metadata.processingTimeMs,
        tokens: packet?.metadata.tokens,
        credits: packet?.metadata.creditsCost
      },
      fullPacket: packet
    };

    return ConnectionInspectionSchema.parse(inspection);
  }

  /**
   * Clears all packets and subscribers.
   */
  public clear(): void {
    this.packets.clear();
    this.subscribers.clear();
  }
}

export const globalDataBus = new DataBus();
