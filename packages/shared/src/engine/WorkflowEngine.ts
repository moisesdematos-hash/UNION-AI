import {
  WorkflowDefinition,
  WorkflowValidationResult,
  ValidationError,
  ValidationWarning,
  ExecutionPlan,
  ExecutionMode,
  WorkflowValidationResultSchema,
  ExecutionPlanSchema
} from '../types/workflow.js';
import { isTypeCompatible } from '../types/compatibility.js';

export class WorkflowEngine {
  /**
   * Validates a workflow definition before execution.
   * Checks for empty graphs, cycles, required input ports, mandatory configs,
   * and port type compatibility.
   */
  public static validate(workflow: WorkflowDefinition): WorkflowValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Check for empty workflow
    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push({
        message: 'O workflow está vazio. Adicione pelo menos um nó para executar.',
        code: 'EMPTY_WORKFLOW'
      });
      return WorkflowValidationResultSchema.parse({ isValid: false, errors, warnings });
    }

    const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));

    // 2. Build adjacency map & detect cycles
    const adjacency = new Map<string, string[]>();
    for (const node of workflow.nodes) {
      adjacency.set(node.id, []);
    }

    for (const conn of workflow.connections) {
      if (nodeMap.has(conn.sourceNodeId) && nodeMap.has(conn.targetNodeId)) {
        adjacency.get(conn.sourceNodeId)!.push(conn.targetNodeId);
      }
    }

    // Cycle detection via DFS with 3-color marking
    // 0 = unvisited, 1 = visiting (in recursion stack), 2 = visited
    const visited = new Map<string, number>();
    const parentPath = new Map<string, string>();
    let cycleFound = false;
    let cycleNodes: string[] = [];

    const dfs = (nodeId: string): boolean => {
      visited.set(nodeId, 1);

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (visited.get(neighbor) === 1) {
          // Cycle detected
          cycleFound = true;
          cycleNodes = [neighbor, nodeId];
          return true;
        }
        if (!visited.has(neighbor) || visited.get(neighbor) === 0) {
          parentPath.set(neighbor, nodeId);
          if (dfs(neighbor)) return true;
        }
      }

      visited.set(nodeId, 2);
      return false;
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.id) || visited.get(node.id) === 0) {
        if (dfs(node.id)) break;
      }
    }

    if (cycleFound) {
      errors.push({
        nodeId: cycleNodes[0],
        message: `Ciclo fechado (loop infinito) detectado entre os nós: ${cycleNodes.join(' ➔ ')}. Workflows devem ser Grafos Acíclicos Dirigidos (DAG).`,
        code: 'CYCLE_DETECTED'
      });
    }

    // 3. Check required input ports
    for (const node of workflow.nodes) {
      for (const input of node.inputs) {
        if (input.required) {
          const hasIncoming = workflow.connections.some(
            (c) => c.targetNodeId === node.id && c.targetPortId === input.id
          );
          if (!hasIncoming) {
            errors.push({
              nodeId: node.id,
              portId: input.id,
              message: `Porta de entrada obrigatória "${input.label || input.name}" no nó "${node.label}" não possui conexão.`,
              code: 'MISSING_REQUIRED_INPUT'
            });
          }
        }
      }
    }

    // 4. Validate mandatory configurations by node type
    for (const node of workflow.nodes) {
      const config = node.config || {};
      if (node.type === 'source-youtube') {
        const url = String(config.url || '').trim();
        if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
          errors.push({
            nodeId: node.id,
            message: `Nó "${node.label}" requer uma URL válida do YouTube configurada.`,
            code: 'MISSING_REQUIRED_CONFIG'
          });
        }
      } else if (node.type === 'source-website') {
        const url = String(config.url || '').trim();
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
          errors.push({
            nodeId: node.id,
            message: `Nó "${node.label}" requer uma URL web válida (iniciando com http:// ou https://).`,
            code: 'MISSING_REQUIRED_CONFIG'
          });
        }
      } else if (node.type === 'source-text') {
        const text = String(config.text || '').trim();
        if (!text) {
          errors.push({
            nodeId: node.id,
            message: `Nó "${node.label}" requer um texto de briefing não vazio.`,
            code: 'MISSING_REQUIRED_CONFIG'
          });
        }
      }
    }

    // 5. Validate port type compatibility on all connections
    for (const conn of workflow.connections) {
      const sourceNode = nodeMap.get(conn.sourceNodeId);
      const targetNode = nodeMap.get(conn.targetNodeId);

      if (sourceNode && targetNode) {
        const sourcePort = sourceNode.outputs.find((p) => p.id === conn.sourcePortId);
        const targetPort = targetNode.inputs.find((p) => p.id === conn.targetPortId);

        if (sourcePort && targetPort) {
          if (!isTypeCompatible(sourcePort.type, targetPort.type)) {
            errors.push({
              connectionId: conn.id,
              nodeId: conn.targetNodeId,
              portId: conn.targetPortId,
              message: `Conexão incompatível: Porta "${sourcePort.name}" (${sourcePort.type}) não é compatível com "${targetPort.name}" (${targetPort.type}).`,
              code: 'INCOMPATIBLE_CONNECTION_TYPE'
            });
          }
        }
      }
    }

    // 6. Warnings for dangling/isolated nodes (0 inputs and 0 outputs)
    for (const node of workflow.nodes) {
      const hasAnyInputConn = workflow.connections.some((c) => c.targetNodeId === node.id);
      const hasAnyOutputConn = workflow.connections.some((c) => c.sourceNodeId === node.id);

      if (!hasAnyInputConn && !hasAnyOutputConn && workflow.nodes.length > 1) {
        warnings.push({
          nodeId: node.id,
          message: `Nó isolado "${node.label}" não possui nenhuma conexão no workflow.`,
          code: 'DANGLING_NODE'
        });
      }
    }

    const isValid = errors.length === 0;
    return WorkflowValidationResultSchema.parse({ isValid, errors, warnings });
  }

  /**
   * Generates a deterministic ExecutionPlan using topological sort with parallel batches.
   * Supports 'RUN' (entire graph), 'RUN_FROM_HERE' (downstream subgraph), and 'RETRY'.
   */
  public static generateExecutionPlan(
    workflow: WorkflowDefinition,
    mode: ExecutionMode = 'RUN',
    targetNodeId?: string
  ): ExecutionPlan {
    const validation = this.validate(workflow);
    const cycleError = validation.errors.find((e) => e.code === 'CYCLE_DETECTED');
    if (cycleError) {
      throw new Error(`Não é possível gerar plano de execução: ${cycleError.message}`);
    }

    const allNodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));

    // Determine active set of nodes based on mode
    let activeNodeIds = new Set<string>();

    if (mode === 'RUN_FROM_HERE' && targetNodeId) {
      if (!allNodeMap.has(targetNodeId)) {
        throw new Error(`Nó alvo não encontrado para RUN_FROM_HERE: ${targetNodeId}`);
      }
      // Extract downstream reachable subgraph via BFS
      activeNodeIds.add(targetNodeId);
      const queue = [targetNodeId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const downstreamConnections = workflow.connections.filter((c) => c.sourceNodeId === current);
        for (const conn of downstreamConnections) {
          if (!activeNodeIds.has(conn.targetNodeId)) {
            activeNodeIds.add(conn.targetNodeId);
            queue.push(conn.targetNodeId);
          }
        }
      }
    } else {
      // Full graph
      activeNodeIds = new Set(workflow.nodes.map((n) => n.id));
    }

    // Build dependency graphs for active nodes
    const inDegree = new Map<string, number>();
    const dependencies: Record<string, string[]> = {};
    const dependents: Record<string, string[]> = {};

    for (const nodeId of activeNodeIds) {
      inDegree.set(nodeId, 0);
      dependencies[nodeId] = [];
      dependents[nodeId] = [];
    }

    for (const conn of workflow.connections) {
      if (activeNodeIds.has(conn.sourceNodeId) && activeNodeIds.has(conn.targetNodeId)) {
        dependents[conn.sourceNodeId].push(conn.targetNodeId);
        dependencies[conn.targetNodeId].push(conn.sourceNodeId);
        inDegree.set(conn.targetNodeId, (inDegree.get(conn.targetNodeId) || 0) + 1);
      }
    }

    // Topological sort with parallel batches (Kahn's Algorithm by levels)
    const levels: string[][] = [];
    let currentLevel: string[] = [];

    // Level 0: nodes with in-degree 0
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        currentLevel.push(nodeId);
      }
    }

    const executionOrder: string[] = [];
    const processedNodes = new Set<string>();

    while (currentLevel.length > 0) {
      levels.push(currentLevel);
      const nextLevel: string[] = [];

      for (const nodeId of currentLevel) {
        executionOrder.push(nodeId);
        processedNodes.add(nodeId);

        for (const dependentId of dependents[nodeId]) {
          const newDegree = (inDegree.get(dependentId) || 0) - 1;
          inDegree.set(dependentId, newDegree);
          if (newDegree === 0) {
            nextLevel.push(dependentId);
          }
        }
      }

      currentLevel = nextLevel;
    }

    if (processedNodes.size !== activeNodeIds.size) {
      throw new Error('Falha ao ordenar topologicamente: ciclo não resolvido no grafo de dependências.');
    }

    const plan: ExecutionPlan = {
      workflowId: workflow.id,
      mode,
      targetNodeId,
      totalNodes: activeNodeIds.size,
      levels,
      executionOrder,
      dependencies,
      dependents
    };

    return ExecutionPlanSchema.parse(plan);
  }
}
