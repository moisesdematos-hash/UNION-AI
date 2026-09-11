import { randomUUID } from 'crypto';
import { 
  WorkflowTemplate, 
  OFFICIAL_TEMPLATES, 
  WorkflowDefinition,
  NodeDefinition,
  ConnectionDefinition
} from '@union/shared';
import { workflowRepository } from './workflow-repository.js';
import { auditService } from './audit-service.js';

export class TemplateService {
  listTemplates(category?: string): WorkflowTemplate[] {
    if (category) {
      return OFFICIAL_TEMPLATES.filter(
        t => t.category.toLowerCase() === category.toLowerCase()
      );
    }
    return OFFICIAL_TEMPLATES;
  }

  getTemplateById(templateId: string): WorkflowTemplate | null {
    return OFFICIAL_TEMPLATES.find(t => t.id === templateId) || null;
  }

  instantiateTemplate(params: {
    templateId: string;
    projectId: string;
    userId: string;
    userEmail?: string;
    workflowName?: string;
  }): WorkflowDefinition {
    const { templateId, projectId, userId, userEmail, workflowName } = params;
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // 1. Create a fresh workflow container
    const name = workflowName || template.name;
    const wf = workflowRepository.createWorkflow(projectId, userId, name, template.description);

    // 2. Clone nodes with new unique IDs
    const nodeIdMap = new Map<string, string>();
    const clonedNodes: NodeDefinition[] = template.nodes.map(originalNode => {
      const newNodeId = `node-${randomUUID().slice(0, 8)}`;
      nodeIdMap.set(originalNode.id, newNodeId);

      return {
        ...originalNode,
        id: newNodeId,
        state: 'IDLE',
        inputs: [...originalNode.inputs],
        outputs: [...originalNode.outputs],
        config: JSON.parse(JSON.stringify(originalNode.config || {}))
      };
    });

    // 3. Clone connections remapped to the new node IDs
    const clonedConnections: ConnectionDefinition[] = template.connections.map(originalConn => {
      const newSourceNodeId = nodeIdMap.get(originalConn.sourceNodeId) || originalConn.sourceNodeId;
      const newTargetNodeId = nodeIdMap.get(originalConn.targetNodeId) || originalConn.targetNodeId;

      return {
        ...originalConn,
        id: `conn-${randomUUID().slice(0, 8)}`,
        sourceNodeId: newSourceNodeId,
        targetNodeId: newTargetNodeId,
        state: 'connected'
      };
    });

    // 4. Persist nodes and connections in SQLite
    const savedWorkflow = workflowRepository.saveWorkflowState(wf.id, userId, {
      nodes: clonedNodes,
      connections: clonedConnections,
      viewport: { x: 0, y: 0, zoom: 1 }
    });

    // 5. Record audit trail event
    if (userEmail) {
      auditService.recordEvent({
        actorId: userId,
        actorEmail: userEmail,
        action: 'WORKFLOW_CREATE',
        entityType: 'workflow',
        entityId: savedWorkflow.id,
        details: {
          templateId,
          templateName: template.name,
          nodesInstantiated: clonedNodes.length,
          connectionsInstantiated: clonedConnections.length
        }
      });
    }

    return savedWorkflow;
  }
}

export const templateService = new TemplateService();
