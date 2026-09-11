import { randomUUID } from 'crypto';
import { getDatabase } from '../db/database.js';
import { 
  WorkflowDefinition, 
  NodeDefinition, 
  ConnectionDefinition,
  NodeDefinitionSchema,
  ConnectionDefinitionSchema,
  WorkflowRun,
  WorkflowVersion
} from '@union/shared';

export interface ProjectEntity {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export class WorkflowRepository {
  private db = getDatabase();

  createProject(userId: string, name: string, description?: string): ProjectEntity {
    const id = randomUUID();
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO projects (id, user_id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, name.trim(), description || null, now, now);

    return {
      id,
      userId,
      name: name.trim(),
      description,
      createdAt: now,
      updatedAt: now
    };
  }

  listProjects(userId: string): ProjectEntity[] {
    const rows = this.db.prepare(`
      SELECT id, user_id, name, description, created_at, updated_at
      FROM projects WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as Array<{ id: string; user_id: string; name: string; description: string | null; created_at: number; updated_at: number }>;

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      description: r.description || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  createWorkflow(projectId: string, userId: string, name: string, description?: string): WorkflowDefinition {
    // Verify project belongs to user
    const project = this.db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectId, userId);
    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    const id = randomUUID();
    const now = Date.now();

    this.db.prepare(`
      INSERT INTO workflows (id, project_id, name, description, viewport_x, viewport_y, viewport_zoom, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, 0, 1, 1, ?, ?)
    `).run(id, projectId, name.trim(), description || null, now, now);

    return {
      id,
      name: name.trim(),
      description,
      nodes: [],
      connections: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      version: 1,
      createdAt: now,
      updatedAt: now
    };
  }

  getWorkflow(workflowId: string, userId: string): WorkflowDefinition | null {
    const wfRow = this.db.prepare(`
      SELECT w.id, w.name, w.description, w.viewport_x, w.viewport_y, w.viewport_zoom, w.version, w.created_at, w.updated_at
      FROM workflows w
      JOIN projects p ON w.project_id = p.id
      WHERE w.id = ? AND p.user_id = ?
    `).get(workflowId, userId) as {
      id: string;
      name: string;
      description: string | null;
      viewport_x: number;
      viewport_y: number;
      viewport_zoom: number;
      version: number;
      created_at: number;
      updated_at: number;
    } | undefined;

    if (!wfRow) return null;

    // Load nodes
    const nodeRows = this.db.prepare(`
      SELECT id, type, label, category, position_x, position_y, inputs_json, outputs_json, config_json, state, execution_info_json
      FROM workflow_nodes WHERE workflow_id = ?
    `).all(workflowId) as Array<{
      id: string;
      type: string;
      label: string;
      category: string;
      position_x: number;
      position_y: number;
      inputs_json: string;
      outputs_json: string;
      config_json: string;
      state: string;
      execution_info_json: string | null;
    }>;

    const nodes: NodeDefinition[] = nodeRows.map((nr) => {
      const rawNode = {
        id: nr.id,
        type: nr.type,
        label: nr.label,
        category: nr.category,
        position: { x: nr.position_x, y: nr.position_y },
        inputs: JSON.parse(nr.inputs_json),
        outputs: JSON.parse(nr.outputs_json),
        config: JSON.parse(nr.config_json),
        state: nr.state,
        executionInfo: nr.execution_info_json ? JSON.parse(nr.execution_info_json) : undefined
      };
      return NodeDefinitionSchema.parse(rawNode);
    });

    // Load connections
    const connRows = this.db.prepare(`
      SELECT id, source_node_id, source_port_id, target_node_id, target_port_id, state, last_packet_json, error_message
      FROM workflow_connections WHERE workflow_id = ?
    `).all(workflowId) as Array<{
      id: string;
      source_node_id: string;
      source_port_id: string;
      target_node_id: string;
      target_port_id: string;
      state: string;
      last_packet_json: string | null;
      error_message: string | null;
    }>;

    const connections: ConnectionDefinition[] = connRows.map((cr) => {
      const rawConn = {
        id: cr.id,
        sourceNodeId: cr.source_node_id,
        sourcePortId: cr.source_port_id,
        targetNodeId: cr.target_node_id,
        targetPortId: cr.target_port_id,
        state: cr.state,
        lastPacket: cr.last_packet_json ? JSON.parse(cr.last_packet_json) : undefined,
        errorMessage: cr.error_message || undefined
      };
      return ConnectionDefinitionSchema.parse(rawConn);
    });

    return {
      id: wfRow.id,
      name: wfRow.name,
      description: wfRow.description || undefined,
      viewport: {
        x: wfRow.viewport_x,
        y: wfRow.viewport_y,
        zoom: wfRow.viewport_zoom
      },
      version: wfRow.version,
      createdAt: wfRow.created_at,
      updatedAt: wfRow.updated_at,
      nodes,
      connections
    };
  }

  saveWorkflowState(
    workflowId: string,
    userId: string,
    state: {
      name?: string;
      description?: string;
      viewport?: { x: number; y: number; zoom: number };
      nodes: NodeDefinition[];
      connections: ConnectionDefinition[];
    }
  ): WorkflowDefinition {
    const existing = this.getWorkflow(workflowId, userId);
    if (!existing) {
      throw new Error('Workflow not found or unauthorized');
    }

    const now = Date.now();
    const newVersion = existing.version + 1;
    const name = state.name || existing.name;
    const description = state.description !== undefined ? state.description : existing.description;
    const viewport = state.viewport || existing.viewport;

    // Atomic transaction for workflow state, nodes and connections
    const syncTransaction = this.db.transaction(() => {
      // 1. Update workflow metadata
      this.db.prepare(`
        UPDATE workflows
        SET name = ?, description = ?, viewport_x = ?, viewport_y = ?, viewport_zoom = ?, version = ?, updated_at = ?
        WHERE id = ?
      `).run(name, description || null, viewport.x, viewport.y, viewport.zoom, newVersion, now, workflowId);

      // 2. Clear old nodes & connections
      this.db.prepare('DELETE FROM workflow_connections WHERE workflow_id = ?').run(workflowId);
      this.db.prepare('DELETE FROM workflow_nodes WHERE workflow_id = ?').run(workflowId);

      // 3. Insert nodes
      const insertNodeStmt = this.db.prepare(`
        INSERT INTO workflow_nodes (
          id, workflow_id, type, label, category, position_x, position_y,
          inputs_json, outputs_json, config_json, state, execution_info_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const node of state.nodes) {
        insertNodeStmt.run(
          node.id,
          workflowId,
          node.type,
          node.label,
          node.category,
          node.position.x,
          node.position.y,
          JSON.stringify(node.inputs),
          JSON.stringify(node.outputs),
          JSON.stringify(node.config || {}),
          node.state || 'IDLE',
          node.executionInfo ? JSON.stringify(node.executionInfo) : null,
          now,
          now
        );
      }

      // 4. Insert connections
      const insertConnStmt = this.db.prepare(`
        INSERT INTO workflow_connections (
          id, workflow_id, source_node_id, source_port_id, target_node_id, target_port_id, state, last_packet_json, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const conn of state.connections) {
        insertConnStmt.run(
          conn.id,
          workflowId,
          conn.sourceNodeId,
          conn.sourcePortId,
          conn.targetNodeId,
          conn.targetPortId,
          conn.state || 'connected',
          conn.lastPacket ? JSON.stringify(conn.lastPacket) : null,
          conn.errorMessage || null,
          now
        );
      }
    });

    syncTransaction();

    const saved = this.getWorkflow(workflowId, userId);
    if (!saved) throw new Error('Failed to retrieve saved workflow');
    return saved;
  }

  deleteWorkflow(workflowId: string, userId: string): boolean {
    const existing = this.getWorkflow(workflowId, userId);
    if (!existing) return false;

    this.db.prepare('DELETE FROM workflows WHERE id = ?').run(workflowId);
    return true;
  }

  recordWorkflowRun(
    userId: string,
    workflowId: string,
    data: {
      status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
      mode?: 'RUN' | 'RUN_FROM_HERE' | 'RETRY';
      totalNodes?: number;
      completedNodes?: number;
      failedNodes?: number;
      totalTokens?: number;
      totalCostCredits?: number;
      durationMs?: number;
      summary?: Record<string, unknown>;
    }
  ): WorkflowRun {
    const existing = this.getWorkflow(workflowId, userId);
    if (!existing) throw new Error('Workflow not found or unauthorized');

    const id = randomUUID();
    const now = Date.now();
    const mode = data.mode || 'RUN';
    const totalNodes = data.totalNodes || 0;
    const completedNodes = data.completedNodes || 0;
    const failedNodes = data.failedNodes || 0;
    const totalTokens = data.totalTokens || 0;
    const totalCostCredits = data.totalCostCredits || 0;
    const durationMs = data.durationMs || 0;
    const summaryJson = JSON.stringify(data.summary || {});
    const completedAt = data.status !== 'RUNNING' ? now : null;

    this.db.prepare(`
      INSERT INTO workflow_runs (
        id, workflow_id, user_id, status, mode,
        total_nodes, completed_nodes, failed_nodes,
        total_tokens, total_cost_credits, duration_ms,
        summary_json, created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, workflowId, userId, data.status, mode,
      totalNodes, completedNodes, failedNodes,
      totalTokens, totalCostCredits, durationMs,
      summaryJson, now, completedAt
    );

    return {
      id,
      workflowId,
      userId,
      status: data.status,
      mode,
      totalNodes,
      completedNodes,
      failedNodes,
      totalTokens,
      totalCostCredits,
      durationMs,
      summary: data.summary || {},
      createdAt: now,
      completedAt
    };
  }

  listWorkflowRuns(userId: string, workflowId: string, limit = 50): WorkflowRun[] {
    const existing = this.getWorkflow(workflowId, userId);
    if (!existing) throw new Error('Workflow not found or unauthorized');

    const rows = this.db.prepare(`
      SELECT id, workflow_id, user_id, status, mode,
             total_nodes, completed_nodes, failed_nodes,
             total_tokens, total_cost_credits, duration_ms,
             summary_json, created_at, completed_at
      FROM workflow_runs
      WHERE workflow_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(workflowId, userId, limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      workflowId: r.workflow_id,
      userId: r.user_id,
      status: r.status,
      mode: r.mode,
      totalNodes: r.total_nodes,
      completedNodes: r.completed_nodes,
      failedNodes: r.failed_nodes,
      totalTokens: r.total_tokens,
      totalCostCredits: r.total_cost_credits,
      durationMs: r.duration_ms,
      summary: JSON.parse(r.summary_json || '{}'),
      createdAt: r.created_at,
      completedAt: r.completed_at
    }));
  }

  getWorkflowRun(userId: string, workflowId: string, runId: string): WorkflowRun | null {
    const r = this.db.prepare(`
      SELECT id, workflow_id, user_id, status, mode,
             total_nodes, completed_nodes, failed_nodes,
             total_tokens, total_cost_credits, duration_ms,
             summary_json, created_at, completed_at
      FROM workflow_runs
      WHERE id = ? AND workflow_id = ? AND user_id = ?
    `).get(runId, workflowId, userId) as any;

    if (!r) return null;

    return {
      id: r.id,
      workflowId: r.workflow_id,
      userId: r.user_id,
      status: r.status,
      mode: r.mode,
      totalNodes: r.total_nodes,
      completedNodes: r.completed_nodes,
      failedNodes: r.failed_nodes,
      totalTokens: r.total_tokens,
      totalCostCredits: r.total_cost_credits,
      durationMs: r.duration_ms,
      summary: JSON.parse(r.summary_json || '{}'),
      createdAt: r.created_at,
      completedAt: r.completed_at
    };
  }

  createWorkflowVersion(
    userId: string,
    workflowId: string,
    name: string,
    description?: string
  ): WorkflowVersion {
    const existing = this.getWorkflow(workflowId, userId);
    if (!existing) throw new Error('Workflow not found or unauthorized');

    const id = randomUUID();
    const now = Date.now();
    const versionNumber = existing.version;

    this.db.prepare(`
      INSERT INTO workflow_versions (
        id, workflow_id, version_number, name, description, snapshot_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      workflowId,
      versionNumber,
      name.trim(),
      description || null,
      JSON.stringify(existing),
      now
    );

    return {
      id,
      workflowId,
      versionNumber,
      name: name.trim(),
      description,
      snapshot: existing,
      createdAt: now
    };
  }

  listWorkflowVersions(userId: string, workflowId: string): WorkflowVersion[] {
    const existing = this.getWorkflow(workflowId, userId);
    if (!existing) throw new Error('Workflow not found or unauthorized');

    const rows = this.db.prepare(`
      SELECT id, workflow_id, version_number, name, description, snapshot_json, created_at
      FROM workflow_versions
      WHERE workflow_id = ?
      ORDER BY version_number DESC, created_at DESC
    `).all(workflowId) as any[];

    return rows.map((r) => ({
      id: r.id,
      workflowId: r.workflow_id,
      versionNumber: r.version_number,
      name: r.name,
      description: r.description || undefined,
      snapshot: JSON.parse(r.snapshot_json),
      createdAt: r.created_at
    }));
  }

  rollbackWorkflowToVersion(userId: string, workflowId: string, versionId: string): WorkflowDefinition {
    const existing = this.getWorkflow(workflowId, userId);
    if (!existing) throw new Error('Workflow not found or unauthorized');

    const versionRow = this.db.prepare(`
      SELECT snapshot_json FROM workflow_versions
      WHERE id = ? AND workflow_id = ?
    `).get(versionId, workflowId) as { snapshot_json: string } | undefined;

    if (!versionRow) throw new Error('Workflow version snapshot not found');

    const snapshot = JSON.parse(versionRow.snapshot_json) as WorkflowDefinition;

    // Save snapshot state into active workflow, incrementing current version
    return this.saveWorkflowState(workflowId, userId, {
      name: snapshot.name,
      description: snapshot.description,
      viewport: snapshot.viewport,
      nodes: snapshot.nodes,
      connections: snapshot.connections
    });
  }
}

export const workflowRepository = new WorkflowRepository();
