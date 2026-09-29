import { describe, it, expect } from 'vitest';
import { 
  searchUnionKnowledgeBase, 
  UNION_KNOWLEDGE_BASE, 
  QUICK_KNOWLEDGE_QUESTIONS 
} from '../services/unionKnowledgeBase.js';

describe('unionKnowledgeBase (100% Offline Knowledge Engine)', () => {
  it('contains full catalog of 10 key platform knowledge items', () => {
    expect(UNION_KNOWLEDGE_BASE.length).toBeGreaterThanOrEqual(10);
    expect(QUICK_KNOWLEDGE_QUESTIONS.length).toBeGreaterThanOrEqual(5);
  });

  it('accurately resolves "como crio o ebook?"', () => {
    const res = searchUnionKnowledgeBase('como crio o ebook?');
    expect(res.isExactMatch).toBe(true);
    expect(res.relevantItem?.id).toBe('criar-ebook');
    expect(res.answer).toContain('Como Criar um E-book no UNION.AI');
    expect(res.answer).toContain('Union Forge');
    expect(res.actions.length).toBeGreaterThan(0);
  });

  it('accurately resolves "onde vejo o ebook pronto?" and typos like "onde vijo o ebook"', () => {
    const res1 = searchUnionKnowledgeBase('onde vejo o ebook pronto?');
    expect(res1.isExactMatch).toBe(true);
    expect(res1.relevantItem?.id).toBe('onde-ver-ebook');
    expect(res1.answer).toContain('Onde Ver o E-book Pronto');
    expect(res1.answer).toContain('Leitor Modal');

    const res2 = searchUnionKnowledgeBase('onde vijo o ebook');
    expect(res2.isExactMatch).toBe(true);
    expect(res2.relevantItem?.id).toBe('onde-ver-ebook');
  });

  it('accurately resolves "o botao cascata habilita o que?"', () => {
    const res = searchUnionKnowledgeBase('o botao cascata habilita o que?');
    expect(res.isExactMatch).toBe(true);
    expect(res.relevantItem?.id).toBe('botao-cascata');
    expect(res.answer).toContain('O que Faz o Botão Cascata?');
    expect(res.answer).toContain('Execução Contínua em Cadeia');
  });

  it('accurately resolves "como funciona a pagina de vendas?"', () => {
    const res = searchUnionKnowledgeBase('como funciona a pagina de vendas?');
    expect(res.isExactMatch).toBe(true);
    expect(res.relevantItem?.id).toBe('pagina-vendas-14-blocos');
    expect(res.answer).toContain('14 Blocos');
  });

  it('accurately resolves "como usar o simulador cps?"', () => {
    const res = searchUnionKnowledgeBase('como usar o simulador cps?');
    expect(res.isExactMatch).toBe(true);
    expect(res.relevantItem?.id).toBe('simulador-cps');
    expect(res.answer).toContain('Dr. Roberto Meirelles');
    expect(res.answer).toContain('Auto-Cura');
  });

  it('accurately resolves "por que o no ficou failed?"', () => {
    const res = searchUnionKnowledgeBase('por que o no ficou failed?');
    expect(res.isExactMatch).toBe(true);
    expect(res.relevantItem?.id).toBe('troubleshooting-erros');
    expect(res.answer).toContain('Solução de Problemas');
  });

  it('accurately resolves "como funciona o modo offline?"', () => {
    const res = searchUnionKnowledgeBase('como funciona o modo offline?');
    expect(res.isExactMatch).toBe(true);
    expect(res.relevantItem?.id).toBe('modo-offline');
    expect(res.answer).toContain('100% Offline');
  });

  it('provides rich structured fallback if query is broad or empty', () => {
    const res = searchUnionKnowledgeBase('qualquer duvida aleatoria desconhecida');
    expect(res.answer).toContain('Assistente Especialista UNION.AI (100% Offline)');
    expect(res.suggestedFollowUps.length).toBeGreaterThan(0);
    expect(res.actions.length).toBeGreaterThan(0);
  });
});
