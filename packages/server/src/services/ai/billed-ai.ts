import { AiEngine } from './ai-engine.js';
import { creditsService } from '../credits-service.js';
import { env } from '../../config/env.js';
import type { AiPromptRequest } from '@union/shared';
export async function executeBilledAi(userId: string, request: AiPromptRequest) {
    const context = request.context ? JSON.stringify(request.context) : '';
    const inputBound = Buffer.byteLength((request.systemPrompt || '') + request.userPrompt + context) + 2048;
    if (inputBound > 65000)
        throw new Error('AI_INPUT_TOO_LARGE');
    const reserve = Math.ceil((inputBound * env.GROQ_INPUT_CREDITS_PER_MILLION + 4000 * env.GROQ_OUTPUT_CREDITS_PER_MILLION) / 10) / 100000;
    const reservation = await creditsService.deductCredits(userId, reserve, { description: 'AI usage reservation' });
    if (!reservation.success)
        throw new Error('INSUFFICIENT_CREDITS');
    let cost = 0;
    try {
        const result = await AiEngine.execute(request);
        cost = result.creditsCost;
        if (cost > reserve) {
            const extra = await creditsService.deductCredits(userId, cost - reserve, { description: 'AI usage adjustment' });
            if (!extra.success)
                throw new Error('AI_USAGE_EXCEEDS_RESERVATION');
        }
        return result;
    }
    finally {
        if (reserve > cost)
            await creditsService.addCredits(userId, reserve - cost, { type: 'REFUND', description: 'Unused AI reservation returned' });
    }
}
