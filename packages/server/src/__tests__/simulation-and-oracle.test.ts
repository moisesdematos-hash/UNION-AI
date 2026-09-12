import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../services/marketing/simulation-engine.js';
import { ProjectOracleService } from '../services/chat/project-oracle-service.js';

describe('SimulationEngine & ProjectOracle Service Tests', () => {
  describe('SimulationEngine', () => {
    it('returns the 5 built-in synthetic personas with valid schemas', () => {
      const personas = SimulationEngine.getBuiltinPersonas();
      expect(personas).toHaveLength(5);
      expect(personas.map(p => p.archetype)).toEqual([
        'SKEPTIC',
        'BUSY_EXECUTIVE',
        'BUDGET_SAVER',
        'ANALYTICAL',
        'EMOTIONAL'
      ]);
    });

    it('simulates conversion scoring and returns CPS and Heatmap evaluations', async () => {
      const result = await SimulationEngine.simulateConversion({
        title: 'Sales Page Test',
        sourceType: 'SALES_PAGE',
        blocks: [
          {
            id: 'b-1',
            name: 'Hero Section',
            content: 'Como multiplicar o faturamento com IA autônoma em menos de 14 dias sem equipe.'
          },
          {
            id: 'b-2',
            name: 'Preço e Condição',
            content: 'Apenas R$ 97 por mês.'
          }
        ]
      });

      expect(result.result.conversionProbabilityScore).toBeGreaterThanOrEqual(15);
      expect(result.result.conversionProbabilityScore).toBeLessThanOrEqual(99);
      expect(result.result.heatmap).toHaveLength(2);
      expect(result.result.personas).toHaveLength(5);
      expect(result.result.topStrengths.length).toBeGreaterThan(0);
      expect(result.packet.type).toBe('JSON');
      expect(result.creditsCost).toBeGreaterThan(0);
    });

    it('performs 1-click auto-healing on a block to eliminate friction', async () => {
      const healed = await SimulationEngine.autoHealBlock({
        blockId: 'b-2',
        blockName: 'Preço e Oferta',
        originalContent: 'Apenas R$ 97 por mês.',
        personaArchetype: 'SKEPTIC',
        frictionPoint: 'Falta de garantia explícita.',
        suggestedAction: 'Adicione garantia incondicional.'
      });

      expect(healed.blockId).toBe('b-2');
      expect(healed.healedContent).toContain('GARANTIA INCONDICIONAL');
      expect(healed.improvementsMade.length).toBeGreaterThan(0);
      expect(healed.estimatedScoreIncrease).toBeGreaterThan(0);
    });
  });

  describe('ProjectOracleService', () => {
    it('answers questions about Data Bus and references pertinent files', async () => {
      const res = await ProjectOracleService.answerQuestion({
        question: 'Como funciona o Data Bus e o DataPacket?'
      });

      expect(res.category).toBe('DATA_BUS');
      expect(res.relevantFiles).toContain('packages/shared/src/types/data-bus.ts');
      expect(res.answer).toContain('DataPacket');
      expect(res.suggestedFollowUps.length).toBeGreaterThan(0);
    });

    it('answers questions about the Conversion Simulator and personas', async () => {
      const res = await ProjectOracleService.answerQuestion({
        question: 'O que é o simulador de conversão com heatmap?'
      });

      expect(res.category).toBe('SIMULATOR');
      expect(res.answer).toContain('Dr. Roberto Meirelles');
      expect(res.answer).toContain('Auto-Healing');
      expect(res.suggestedFollowUps.length).toBeGreaterThan(0);
    });

    it('answers questions about the 14-block sales page copy', async () => {
      const res = await ProjectOracleService.answerQuestion({
        question: 'Quais são os 14 blocos da página de vendas?'
      });

      expect(res.category).toBe('MARKETING_ENGINES');
      expect(res.answer).toContain('Bloco 1');
      expect(res.answer).toContain('Bloco 14');
    });

    it('provides a general system overview for unspecified questions', async () => {
      const res = await ProjectOracleService.answerQuestion({
        question: 'O que o UNION.AI faz?'
      });

      expect(res.category).toBe('QUICK_START');
      expect(res.answer.includes('UNION.AI') || res.answer.includes('Project Oracle')).toBe(true);
    });

    it('processes multimodal attachments such as PDFs and images', async () => {
      const res = await ProjectOracleService.answerQuestion({
        question: 'Analise este briefing de lançamento',
        attachments: [
          {
            name: 'briefing-copy.pdf',
            type: 'pdf',
            extractedText: 'Produto: Mentoria de IA. Oferta: R$ 997 à vista. Garantia: 30 dias.'
          },
          {
            name: 'mockup.png',
            type: 'image',
            dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA'
          }
        ]
      });

      expect(res.category).toBe('MULTIMODAL');
      expect(res.answer).toContain('Análise Multimodal');
      expect(res.answer).toContain('briefing-copy.pdf');
      expect(res.attachmentAnalysis?.filesProcessed).toBe(2);
      expect(res.attachmentAnalysis?.detectedInsights.length).toBeGreaterThan(0);
    });

    it('extracts and retains persistent long-term memories across session interactions', async () => {
      const sessionId = 'test_sess_' + Date.now();

      // Step 1: User introduces themselves and shares their business
      const res1 = await ProjectOracleService.answerQuestion({
        sessionId,
        question: 'Olá, me chamo Fernando e meu negócio é Mentoria de Alta Performance.'
      });

      expect(res1.memoriesRetained).toBeDefined();
      expect(res1.memoriesRetained?.some(m => m.key === 'Nome do Usuário' && m.value === 'Fernando')).toBe(true);
      expect(res1.memoriesRetained?.some(m => m.key === 'Negócio / Nicho')).toBe(true);

      // Step 2: Query stored history & memories directly
      const history = ProjectOracleService.getSessionHistory(sessionId);
      expect(history.length).toBe(2); // 1 user + 1 oracle
      expect(history[0].sender).toBe('user');
      expect(history[1].sender).toBe('oracle');

      const memories = ProjectOracleService.getSessionMemories(sessionId);
      expect(memories.length).toBeGreaterThanOrEqual(2);

      // Step 3: User asks if the Oracle remembers them
      const res2 = await ProjectOracleService.answerQuestion({
        sessionId,
        question: 'Você lembra qual é o meu nome?'
      });

      expect(res2.answer).toContain('Fernando');

      // Step 4: Clear session
      ProjectOracleService.clearSession(sessionId);
      const clearedHistory = ProjectOracleService.getSessionHistory(sessionId);
      expect(clearedHistory.length).toBe(0);
      const clearedMemories = ProjectOracleService.getSessionMemories(sessionId);
      expect(clearedMemories.length).toBe(0);
    });

    it('adapts response and personality to SKEPTIC (Dr. Roberto Meirelles) persona mode', async () => {
      const res = await ProjectOracleService.answerQuestion({
        question: 'Essa headline vai dobrar as vendas de qualquer curso em 24 horas!',
        personaMode: 'SKEPTIC'
      });

      expect(res.personaMode).toBe('SKEPTIC');
      expect(res.answer).toContain('Dr. Roberto Meirelles');
      expect(res.answer).toContain('REJEITADO');
    });

    it('adapts response to EXECUTIVE (Ana Lívia) mode and COPYWRITER mode with actions', async () => {
      const resExec = await ProjectOracleService.answerQuestion({
        question: 'Proposta de software para automação de clínicas',
        personaMode: 'EXECUTIVE'
      });

      expect(resExec.personaMode).toBe('EXECUTIVE');
      expect(resExec.answer).toContain('Ana Lívia');

      const resCopy = await ProjectOracleService.answerQuestion({
        question: 'Crie uma copy de página de vendas para curso de Python',
        personaMode: 'COPYWRITER'
      });

      expect(resCopy.personaMode).toBe('COPYWRITER');
      expect(resCopy.actions).toBeDefined();
      expect(resCopy.actions?.some(a => a.type === 'TEST_IN_SIMULATOR')).toBe(true);
      expect(resCopy.actions?.some(a => a.type === 'ADD_NODE')).toBe(true);
    });

    it('generates a visual audit report when an image attachment is provided', async () => {
      const res = await ProjectOracleService.answerQuestion({
        question: 'Audite este print da minha landing page',
        attachments: [
          {
            name: 'landing-page-hero.png',
            type: 'image',
            dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA'
          }
        ]
      });

      expect(res.visualAudit).toBeDefined();
      expect(res.visualAudit?.ctaContrastScore).toBeGreaterThan(0);
      expect(res.visualAudit?.readabilityScore).toBeGreaterThan(0);
      expect(res.visualAudit?.recommendations.length).toBeGreaterThan(0);
    });

    it('detects and issues template load action when templates are requested', async () => {
      const res = await ProjectOracleService.answerQuestion({
        question: 'Quero carregar o Template 1 de YouTube to VSL'
      });

      expect(res.actions).toBeDefined();
      const loadTplAction = res.actions?.find(a => a.type === 'LOAD_TEMPLATE');
      expect(loadTplAction).toBeDefined();
      expect(loadTplAction?.payload.templateId).toBe('youtube-content-factory');
    });
  });
});
