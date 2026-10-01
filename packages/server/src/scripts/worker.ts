import { WorkflowJobs } from '../services/workflow-jobs.js';
import { closeOperationalDatabase } from '../db/operational-database.js';
let stopping = false;
process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });
while (!stopping) {
  try { if (!await WorkflowJobs.runNext()) await new Promise(resolve => setTimeout(resolve, 1000)); }
  catch (error) { console.error('[Worker]', error instanceof Error ? error.message : 'Job error'); await new Promise(resolve => setTimeout(resolve, 1000)); }
}
await closeOperationalDatabase();
