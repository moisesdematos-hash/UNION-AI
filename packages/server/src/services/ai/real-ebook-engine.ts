import { z } from 'zod';
import { executeBilledAi } from './billed-ai.js';
import type { ThematicEbookOptions, ThematicEbookResult, EbookChapter, EbookPage } from './thematic-ebook-engine.js';

export async function generateRealThematicEbook(userId: string, options: ThematicEbookOptions, signal?: AbortSignal) {
  const minimum = Math.max(1001, Math.min(3000, Number(options.wordsPerChapter) || 1001));
  const requestedPages = Math.max(10, Math.min(60, Number(options.pageCount) || 10));
  const chapterCount = Math.min(12, Math.max(3, Math.ceil(requestedPages * 400 / minimum)));
  let tokens = 0, credits = 0, model = '';
  const call = async (prompt: string) => {
    if (signal?.aborted) throw new Error('EBOOK_CANCELLED');
    const result = await executeBilledAi(userId, { role: 'ai-writer', model: 'groq-llama-3',
      systemPrompt: 'Você escreve conteúdo editorial original usando o contexto recebido. Não invente fontes, resultados, testemunhos ou imagens. Evite repetição e texto de enchimento.',
      userPrompt: prompt });
    if (result.executionMode !== 'REAL_AI') throw new Error('EBOOK_REQUIRES_REAL_AI');
    tokens += result.tokens.totalTokens; credits += result.creditsCost; model = result.modelUsed;
    return result.content;
  };
  const plan = z.object({ title: z.string().min(1), subtitle: z.string(), chapters: z.array(z.string().min(1)).length(chapterCount) }).parse(JSON.parse((await call(
    `Planeie um livro sobre ${options.prompt}. Nicho: ${options.targetNiche || 'geral'}. Retorne somente JSON: {"title":"...","subtitle":"...","chapters":[${chapterCount} títulos únicos]}. Título pedido: ${options.title || 'proponha um título'}.`
  )).replace(/^```(?:json)?\s*|\s*```$/g, '')));
  const chapters: EbookChapter[] = [], pages: EbookPage[] = [];
  for (let index = 0; index < plan.chapters.length; index++) {
    let content = await call(`Tema e contexto: ${options.prompt}\nPlano: ${JSON.stringify(plan)}\nEscreva APENAS o capítulo ${index + 1}: ${plan.chapters[index]}. Mínimo ${minimum} palavras, Markdown, tom ${options.tone || 'didático'}, público ${options.audienceLevel || 'iniciante'}. Inclua exemplos concretos, exercícios e explicações originais.`);
    if (content.split(/\s+/).filter(Boolean).length < minimum) content += '\n\n' + await call(`Amplie sem repetir o capítulo a seguir com exemplos detalhados e exercícios. Adicione pelo menos ${minimum} palavras inéditas. Tema: ${options.prompt}\n${content}`);
    const words = content.split(/\s+/).filter(Boolean);
    if (words.length < minimum) throw new Error('EBOOK_MINIMUM_WORD_COUNT_NOT_MET');
    const first = pages.length + 1;
    for (let offset = 0; offset < words.length; offset += 400) pages.push({ pageNumber: pages.length + 1, title: plan.chapters[index], content: words.slice(offset, offset + 400).join(' ') });
    chapters.push({ chapterNumber: index + 1, title: plan.chapters[index], content, wordCount: words.length, pagesRange: `${first}-${pages.length}` });
  }
  const result: ThematicEbookResult = { type: 'EBOOK', title: options.title || plan.title, subtitle: plan.subtitle,
    targetNiche: options.targetNiche || 'Geral', pageCount: pages.length, minWordsPerChapter: minimum,
    totalWordCount: chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0), tone: options.tone || 'didactic', audienceLevel: options.audienceLevel || 'beginner', author: 'UNION AI', pages, chapters,
    fullMarkdown: `# ${options.title || plan.title}\n\n${plan.subtitle}\n\n` + chapters.map(chapter => `## ${chapter.title}\n\n${chapter.content}`).join('\n\n') };
  return { result, tokens, credits: Math.round(credits * 100000) / 100000, model };
}
