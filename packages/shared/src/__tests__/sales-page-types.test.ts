import { describe, it, expect } from 'vitest';
import { 
  SalesPageCopySchema, 
  WorkflowGroupSchema, 
  WorkflowDefinitionSchema 
} from '../index.js';

describe('UNION.AI 2.0: Sales Page Copy & Workflow Groups Schemas', () => {
  it('should validate a full 14-block SalesPageCopy object', () => {
    const rawSalesPage = {
      title: 'UNION.AI Enterprise Launch',
      headline: 'Construa e Automatize Equipes Inteiras de IA Visualmente no Canvas',
      subheadline: 'O primeiro workspace de IA onde cada conexão é um fluxo real de dados.',
      problem: 'Chatbots isolados criam ilhas de texto que não se integram com ferramentas de produção.',
      consequences: 'Equipes perdem centenas de horas copiando e colando outputs manualmente sem governança.',
      opportunity: 'Orquestre modelos avançados de IA em esteiras automatizadas que geram ativos completos.',
      mechanism: 'UNION Data Bus com roteamento multi-modelo inteligente e ordenação topológica DAG.',
      benefits: [
        'Redução de 90% no tempo de criação de campanhas e conteúdo',
        'Compatibilidade nativa com múltiplos provedores de IA',
        'Controle de créditos e quotas em tempo real'
      ],
      proof: [
        'Mais de 224 testes automatizados em produção',
        'Zero falhas de concorrência com banco SQLite em modo WAL'
      ],
      offer: 'Acesso vitalício à plataforma UNION.AI com 100 créditos iniciais inclusos.',
      bonuses: [
        'Biblioteca com 4 templates oficiais de alta conversão',
        'Guia definitivo de engenharia de prompts visuais'
      ],
      guarantee: 'Garantia incondicional de satisfação e execução com precisão.',
      objections: [
        'Preciso saber programar? Não, o canvas é 100% visual e interativo.',
        'Funciona em equipe? Sim, suporte corporativo a multi-tenancy e RBAC.'
      ],
      faq: [
        {
          question: 'O que diferencia o UNION.AI de um chatbot comum?',
          answer: 'O UNION.AI possui um barramento físico de dados que transporta payloads tipados entre nós.'
        }
      ],
      cta: 'Iniciar Demonstração Imediata no Canvas'
    };

    const parsed = SalesPageCopySchema.parse(rawSalesPage);
    expect(parsed.headline).toContain('Construa e Automatize');
    expect(parsed.benefits).toHaveLength(3);
    expect(parsed.proof).toHaveLength(2);
    expect(parsed.faq).toHaveLength(1);
    expect(parsed.cta).toBe('Iniciar Demonstração Imediata no Canvas');
  });

  it('should validate WorkflowGroupSchema and nested groups in WorkflowDefinition', () => {
    const group = WorkflowGroupSchema.parse({
      id: 'grp-marketing-1',
      name: 'Marketing Pipeline',
      color: '#10b981',
      nodeIds: ['node-1', 'node-2'],
      isCollapsed: false
    });

    expect(group.id).toBe('grp-marketing-1');
    expect(group.color).toBe('#10b981');
    expect(group.isCollapsed).toBe(false);

    const wf = WorkflowDefinitionSchema.parse({
      id: 'wf-1',
      name: 'Grouped Workflow',
      nodes: [],
      connections: [],
      groups: [group],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    expect(wf.groups).toHaveLength(1);
    expect(wf.groups[0].name).toBe('Marketing Pipeline');
  });
});
