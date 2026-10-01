import { authHeaders } from './authHeaders.js';
export async function fetchWithWorkflowJob(url: string, options: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  if (response.status !== 202) return response;
  const queued = await response.json();
  const id = queued.data.jobId;
  const deadline = Date.now() + 16 * 60 * 1000;
  while (Date.now() < deadline) {
    const status = await fetch(`/api/workflows/jobs/${id}`, { headers: authHeaders() });
    const json = await status.json();
    if (!status.ok) throw new Error(json.message || 'Falha ao consultar geração');
    const job = json.data;
    if (job.status === 'COMPLETED') {
      const completed = job.result.events.find((event: any) => event.type === 'NODE_COMPLETED' && event.outputs?.['out-ebook']);
      if (!completed) throw new Error('Ebook não encontrado no resultado');
      return new Response(JSON.stringify({ success: true, data: completed.outputs['out-ebook'].payload }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (['FAILED', 'STOPPED'].includes(job.status)) throw new Error(job.error || job.result?.summary?.error || 'Falha na geração');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('A geração ainda está pendente. Consulte a execução antes de iniciar outra.');
}
