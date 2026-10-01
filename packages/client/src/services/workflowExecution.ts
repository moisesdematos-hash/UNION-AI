import { ExecutionEngine, type ExecutionEngineOptions, type WorkflowExecutionSummary, type NodeExecutionEvent } from '@union/shared';
import { AUTH_TOKEN_KEY } from './storageService.js';

export async function executeServerWorkflow(options: ExecutionEngineOptions): Promise<WorkflowExecutionSummary> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    if (import.meta.env.MODE === 'test' || import.meta.env.DEV) return ExecutionEngine.execute(options);
    throw new Error('Inicie sessão para executar um workflow. O modo convidado permite editar o canvas.');
  }
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const created = await fetch('/api/workflows/jobs', { method: 'POST', headers, body: JSON.stringify({ workflow: options.workflow, mode: options.plan.mode }), signal: options.signal });
  const response = await created.json();
  if (!created.ok) throw new Error(response.message || 'Não foi possível iniciar a execução');
  const jobId = response.data.id;
  try {
    const deadline = Date.now() + 16 * 60 * 1000;
    while (Date.now() < deadline) {
      if (options.signal?.aborted) throw new Error('Execução cancelada');
      const fetched = await fetch(`/api/workflows/jobs/${jobId}`, { headers, signal: options.signal });
      const json = await fetched.json();
      if (!fetched.ok) throw new Error(json.message || 'Falha ao consultar execução');
      const job = json.data;
      if (job.result?.summary) {
        for (const event of job.result.events as NodeExecutionEvent[]) options.onNodeEvent?.(event);
        options.onSummaryUpdate?.(job.result.summary);
        return job.result.summary;
      }
      if (['FAILED', 'STOPPED'].includes(job.status)) throw new Error(job.error || 'Execução interrompida');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Tempo limite de consulta da execução excedido');
  } catch (error) {
    if (options.signal?.aborted) await fetch(`/api/workflows/jobs/${jobId}`, { method: 'DELETE', headers }).catch(() => undefined);
    throw error;
  }
}
