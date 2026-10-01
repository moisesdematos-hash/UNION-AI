import { Router, Request, Response } from 'express';
import { executeBilledAi } from '../services/ai/billed-ai.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { AiPromptRequestSchema, createDataPacket } from '@union/shared';
export const aiRouter = Router();
aiRouter.use(requireAuth);
// Universal POST /api/ai/execute
const executeHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const validated = AiPromptRequestSchema.parse(req.body);
        const result = await executeBilledAi(req.user!.id, validated);
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
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha ao processar solicitação de IA';
        res.status(400).json({ status: 'error', message });
    }
};
aiRouter.post('/execute', executeHandler);
for (const [path, role] of Object.entries({ chat: 'ai-chat', writer: 'ai-writer', analyst: 'ai-analyst', summarizer: 'ai-summarizer' })) {
    aiRouter.post(`/${path}`, async (req: AuthenticatedRequest, res: Response) => {
        req.body = { ...req.body, role };
        return (await executeHandler(req, res));
    });
}
