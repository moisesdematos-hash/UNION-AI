import { MetricsSnapshot, MetricsSnapshotSchema } from '@union/shared';

export class MetricsCollector {
  private startTime: number = Date.now();
  private workflowsExecutedTotal: number = 0;
  private workflowsFailedTotal: number = 0;
  private tokensConsumedTotal: number = 0;
  private creditsDeductedTotal: number = 0;
  private totalDurationMs: number = 0;
  private activeNodesGauge: number = 0;

  recordExecution(params: {
    durationMs: number;
    success: boolean;
    tokens?: number;
    credits?: number;
  }): void {
    this.workflowsExecutedTotal += 1;
    if (!params.success) {
      this.workflowsFailedTotal += 1;
    }
    this.totalDurationMs += Math.max(params.durationMs, 0);
    this.tokensConsumedTotal += Math.max(params.tokens || 0, 0);
    this.creditsDeductedTotal += Math.max(params.credits || 0, 0);
  }

  incrementActiveNodes(): void {
    this.activeNodesGauge += 1;
  }

  decrementActiveNodes(): void {
    this.activeNodesGauge = Math.max(0, this.activeNodesGauge - 1);
  }

  setActiveNodes(count: number): void {
    this.activeNodesGauge = Math.max(0, count);
  }

  getSnapshot(): MetricsSnapshot {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const avgDurationMs = this.workflowsExecutedTotal > 0 
      ? Math.round((this.totalDurationMs / this.workflowsExecutedTotal) * 100) / 100 
      : 0;
    const errorRatePercent = this.workflowsExecutedTotal > 0
      ? Math.round((this.workflowsFailedTotal / this.workflowsExecutedTotal) * 10000) / 100
      : 0;

    const snapshot: MetricsSnapshot = {
      uptimeSeconds,
      workflowsExecutedTotal: this.workflowsExecutedTotal,
      tokensConsumedTotal: this.tokensConsumedTotal,
      creditsDeductedTotal: Math.round(this.creditsDeductedTotal * 100) / 100,
      avgDurationMs,
      activeNodesGauge: this.activeNodesGauge,
      errorRatePercent
    };

    return MetricsSnapshotSchema.parse(snapshot);
  }

  getPrometheusFormat(): string {
    const snapshot = this.getSnapshot();
    const lines: string[] = [
      '# HELP union_uptime_seconds Total uptime in seconds of the UNION server',
      '# TYPE union_uptime_seconds gauge',
      `union_uptime_seconds ${snapshot.uptimeSeconds}`,
      '',
      '# HELP union_workflows_executed_total Total number of workflow executions completed',
      '# TYPE union_workflows_executed_total counter',
      `union_workflows_executed_total ${snapshot.workflowsExecutedTotal}`,
      '',
      '# HELP union_tokens_consumed_total Total LLM tokens consumed across all workflows',
      '# TYPE union_tokens_consumed_total counter',
      `union_tokens_consumed_total ${snapshot.tokensConsumedTotal}`,
      '',
      '# HELP union_credits_deducted_total Total credits billed and deducted',
      '# TYPE union_credits_deducted_total counter',
      `union_credits_deducted_total ${snapshot.creditsDeductedTotal}`,
      '',
      '# HELP union_workflow_duration_ms_avg Average workflow run duration in milliseconds',
      '# TYPE union_workflow_duration_ms_avg gauge',
      `union_workflow_duration_ms_avg ${snapshot.avgDurationMs}`,
      '',
      '# HELP union_active_nodes_gauge Current number of actively running workflow nodes',
      '# TYPE union_active_nodes_gauge gauge',
      `union_active_nodes_gauge ${snapshot.activeNodesGauge}`,
      '',
      '# HELP union_error_rate_percent Percent of workflow runs that failed',
      '# TYPE union_error_rate_percent gauge',
      `union_error_rate_percent ${snapshot.errorRatePercent}`,
      ''
    ];

    return lines.join('\n');
  }

  reset(): void {
    this.startTime = Date.now();
    this.workflowsExecutedTotal = 0;
    this.workflowsFailedTotal = 0;
    this.tokensConsumedTotal = 0;
    this.creditsDeductedTotal = 0;
    this.totalDurationMs = 0;
    this.activeNodesGauge = 0;
  }
}

export const metricsCollector = new MetricsCollector();
