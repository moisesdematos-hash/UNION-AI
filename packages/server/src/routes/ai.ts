import { Router, Request, Response } from 'express';
import { AiEngine } from '../services/ai/ai-engine.js';
import { AiPromptRequestSchema, createDataPacket } from '@union/shared';

export const aiRouter = Router();

// Universal POST /api/ai/execute
aiRouter.post('/execute', async (req: Request, res: Response) => {
  try {
    const validated = AiPromptRequestSchema.parse(req.body);
    const result = await AiEngine.execute(validated);

    // Create primary text packet
    const textPacket = createDataPacket({
      type: 'TEXT',
      payload: result.content,
      originNodeId: validated.nodeId,
      tokens: result.tokens.totalTokens,
      processingTimeMs: result.durationMs,
      creditsCost: result.creditsCost,
      provider: result.provider,
      model: result.modelUsed
    });

    // Create structured JSON / Metadata packet if structured data is present
    const structuredPacket = result.structured
      ? createDataPacket({
          type: 'JSON',
          payload: result.structured,
          originNodeId: validated.nodeId,
          tokens: result.tokens.completionTokens,
          processingTimeMs: result.durationMs,
          creditsCost: 0,
          provider: result.provider,
          model: result.modelUsed
        })
      : null;

    res.status(200).json({
      status: 'success',
      data: {
        raw: result,
        packets: {
          text: textPacket,
          structured: structuredPacket
        }
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao processar solicitação de IA';
    res.status(400).json({ status: 'error', message });
  }
});

// Shortcut POST /api/ai/chat
aiRouter.post('/chat', async (req: Request, res: Response) => {
  req.body.role = 'ai-chat';
  return (aiRouter as any).handle(req, res);
});

// Shortcut POST /api/ai/writer
aiRouter.post('/writer', async (req: Request, res: Response) => {
  req.body.role = 'ai-writer';
  return (aiRouter as any).handle(req, res);
});

// Shortcut POST /api/ai/analyst
aiRouter.post('/analyst', async (req: Request, res: Response) => {
  req.body.role = 'ai-analyst';
  return (aiRouter as any).handle(req, res);
});

// Shortcut POST /api/ai/summarizer
aiRouter.post('/summarizer', async (req: Request, res: Response) => {
  req.body.role = 'ai-summarizer';
  return (aiRouter as any).handle(req, res);
});
