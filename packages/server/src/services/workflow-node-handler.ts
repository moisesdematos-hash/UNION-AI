import { generateRealThematicEbook } from './ai/real-ebook-engine.js';
import { SimulationEngine } from './marketing/simulation-engine.js';
import { createDataPacket, type NodeExecutionHandler, type AiNodeRole } from '@union/shared';
import { executeBilledAi } from './ai/billed-ai.js';
import { MarketingEngine } from './marketing/marketing-engine.js';
import { WebsiteScraper } from './extractors/website-scraper.js';
import { YouTubeExtractor } from './extractors/youtube-extractor.js';
import { DocumentParser } from './extractors/document-parser.js';

export function realNodeHandler(userId: string): NodeExecutionHandler {
  return async (node, inputs, signal) => {
    if (signal.aborted) throw new Error('Execução cancelada');
    const start = Date.now();
    const context = Object.values(inputs).map(packet => typeof packet.payload === 'string' ? packet.payload : JSON.stringify(packet.payload)).join('\n\n');
    const config = node.config || {};
    let payload: unknown = context, tokens = 0, credits = 0, provider = 'local', model = 'deterministic';
    const prompt = String(config.userPrompt || config.prompt || config.instruction || context || '');
    if (['ai-chat', 'ai-writer', 'ai-analyst', 'ai-summarizer', 'ai-router', 'ai-transform'].includes(node.type)) {
      const response = await executeBilledAi(userId, { role: node.type === 'ai-transform' ? 'ai-writer' : node.type as AiNodeRole, model: 'groq-llama-3', userPrompt: prompt || 'Analise os dados fornecidos', context });
      payload = response.content; tokens = response.tokens.totalTokens; credits = response.creditsCost; provider = response.provider; model = response.modelUsed;
    } else if (node.type.startsWith('marketing-')) {
      const result = node.type === 'marketing-avatar' ? await MarketingEngine.generateAvatar(context || prompt, userId)
        : node.type === 'marketing-competitor' ? await MarketingEngine.generateCompetitorAnalysis(context || prompt, userId)
        : node.type === 'marketing-vsl' ? await MarketingEngine.generateVslScript({ context: context || prompt }, userId)
        : node.type === 'marketing-ads' ? await MarketingEngine.generateAdsMatrix({ sourceText: context || prompt }, userId)
        : node.type === 'marketing-sales-page' ? await MarketingEngine.generateSalesPageCopy({ context: context || prompt }, userId)
        : undefined;
      if (!result) throw new Error(`NODE_NOT_IMPLEMENTED: ${node.type}`);
      payload = result.result; tokens = result.tokens.totalTokens; credits = result.creditsCost; provider = result.provider || 'local'; model = result.modelUsed;
    } else if (node.type === 'ai-ebook-forge') {
      const generated = await generateRealThematicEbook(userId, { ...config, prompt: String(config.topic || config.prompt || prompt || context) + (context ? '\nDados de referência:\n' + context : ''), targetNiche: String(config.niche || 'Geral') }, signal);
      payload = generated.result; tokens = generated.tokens; credits = generated.credits; provider = 'groq'; model = generated.model;
    } else if (node.type === 'ai-conversion-simulator') {
      const result = await SimulationEngine.simulateConversion({ title: node.label, sourceType: 'SALES_PAGE', blocks: [{ id: node.id, name: 'Input', content: context || prompt }] });
      payload = result.result;
    } else if (node.type === 'source-youtube') {
      payload = await YouTubeExtractor.extract(String(config.url || config.videoUrl || context));
    } else if (node.type === 'source-website') {
      payload = await WebsiteScraper.scrape(String(config.url || context));
    } else if (['source-document', 'source-pdf'].includes(node.type)) {
      payload = await DocumentParser.parse(String(config.content || config.fileContent || config.extractedText || context), String(config.fileName || 'document.txt'));
    } else if (['source-text', 'source-url', 'input-text', 'trigger-webhook'].includes(node.type)) {
      payload = config.webhookPayload || config.text || config.url || context;
    } else if (node.type.startsWith('output-') || node.type === 'transform-formatter') {
      payload = context;
    } else {
      throw new Error(`NODE_NOT_IMPLEMENTED: ${node.type}. Este nó não será simulado em execução real.`);
    }
    const outputs: Record<string, ReturnType<typeof createDataPacket>> = {};
    for (const port of node.outputs) {
      let value = payload;
      if (port.id === 'out-markdown' && (payload as any)?.fullMarkdown) value = (payload as any).fullMarkdown;
      if (port.id === 'out-chapters' && (payload as any)?.chapters) value = (payload as any).chapters;
      if (port.type === 'TEXT' && typeof payload !== 'string' && port.id !== 'out-markdown') value = (payload as any)?.fullText || (payload as any)?.cleanText || JSON.stringify(payload);
      if (port.id.includes('transcript') && (payload as any)?.transcript) value = (payload as any).transcript;
      if (port.id.includes('metadata') && (payload as any)?.metadata) value = (payload as any).metadata;
      outputs[port.id] = createDataPacket({ type: port.type, payload: value, originNodeId: node.id, originPortId: port.id, provider, model, tokens, creditsCost: credits, processingTimeMs: Date.now() - start });
    }
    return { outputs, tokens, credits, durationMs: Date.now() - start };
  };
}
