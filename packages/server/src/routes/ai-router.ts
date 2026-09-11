import { Router, Request, Response } from 'express';
import {
  AiRouterEngine,
  AiRouterCriteriaSchema,
  TaskClassificationRequestSchema,
  createDataPacket
} from '@union/shared';
import { AiEngine } from '../services/ai/ai-engine.js';

export const aiRouterRouter = Router();

// POST /api/ai/router/recommend
aiRouterRouter.post('/recommend', (req: Request, res: Response) => {
  try {
    const criteria = AiRouterCriteriaSchema.parse(req.body);
    const recommendation = AiRouterEngine.recommendModel(criteria);

    res.status(200).json({
      status: 'success',
      data: recommendation
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao calcular recomendação do router';
    res.status(400).json({ status: 'error', message });
  }
});

// POST /api/ai/router/classify
aiRouterRouter.post('/classify', (req: Request, res: Response) => {
  try {
    const { text, optimizeFor } = TaskClassificationRequestSchema.parse(req.body);
    const classification = AiRouterEngine.classifyTask(text, optimizeFor);

    res.status(200).json({
      status: 'success',
      data: classification
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao classificar tarefa';
    res.status(400).json({ status: 'error', message });
  }
});

// POST /api/ai/router/execute
aiRouterRouter.post('/execute', async (req: Request, res: Response) => {
  try {
    const { text, optimizeFor = 'balanced', nodeId, role } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ status: 'error', message: 'Campo "text" é obrigatório' });
      return;
    }

    // 1. Semantic classification
    const classification = AiRouterEngine.classifyTask(text, optimizeFor);

    // 2. Multi-dimensional model recommendation
    const recommendation = AiRouterEngine.recommendModel({
      role: role || (classification.category === 'copywriting' ? 'ai-writer' : classification.category === 'analytics' ? 'ai-analyst' : 'ai-chat'),
      optimizeFor,
      promptLength: text.length
    });

    // 3. Execution via AiEngine
    const executionRole = role || (classification.category === 'copywriting' ? 'ai-writer' : classification.category === 'analytics' ? 'ai-analyst' : 'ai-chat');
    const result = await AiEngine.execute({
      nodeId,
      role: executionRole,
      model: recommendation.recommendedModel,
      userPrompt: text
    });

    // 4. Wrap into DataPackets
    const packet = createDataPacket({
      type: 'AI_RESPONSE',
      payload: result.content,
      originNodeId: nodeId,
      tokens: result.tokens.totalTokens,
      processingTimeMs: result.durationMs,
      creditsCost: result.creditsCost,
      provider: result.provider,
      model: result.modelUsed
    });

    res.status(200).json({
      status: 'success',
      data: {
        raw: result,
        routing: {
          classification,
          recommendation
        },
        packet
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao executar router de IA';
    res.status(400).json({ status: 'error', message });
  }
});
