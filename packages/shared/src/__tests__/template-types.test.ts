import { describe, it, expect } from 'vitest';
import { 
  WorkflowTemplateSchema, 
  OFFICIAL_TEMPLATES, 
  TemplateCategoryEnum 
} from '../types/templates.js';
import { WorkflowEngine } from '../engine/WorkflowEngine.js';
import { WorkflowDefinition } from '../types/workflow.js';

describe('Gate 18: Workflow Templates & Official Catalog Schemas', () => {
  it('should validate all official templates against WorkflowTemplateSchema', () => {
    expect(OFFICIAL_TEMPLATES.length).toBe(3);

    for (const template of OFFICIAL_TEMPLATES) {
      const parsed = WorkflowTemplateSchema.parse(template);
      expect(parsed.id).toBe(template.id);
      expect(parsed.nodes.length).toBeGreaterThanOrEqual(4);
      expect(parsed.connections.length).toBeGreaterThanOrEqual(3);
      expect(parsed.estimatedCredits).toBeGreaterThan(0);
      expect(TemplateCategoryEnum.safeParse(parsed.category).success).toBe(true);
    }
  });

  it('should verify that all official templates form valid DAGs in WorkflowEngine', () => {
    for (const template of OFFICIAL_TEMPLATES) {
      const workflow: WorkflowDefinition = {
        id: template.id,
        name: template.name,
        nodes: template.nodes,
        connections: template.connections,
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const validation = WorkflowEngine.validate(workflow);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      const plan = WorkflowEngine.generateExecutionPlan(workflow);
      expect(plan.levels.length).toBeGreaterThan(0);
      expect(plan.totalNodes).toBe(template.nodes.length);
    }
  });

  it('should contain the three signature production templates', () => {
    const ids = OFFICIAL_TEMPLATES.map(t => t.id);
    expect(ids).toContain('youtube-content-factory');
    expect(ids).toContain('competitor-intel-report');
    expect(ids).toContain('marketing-vsl-engine');
  });
});
