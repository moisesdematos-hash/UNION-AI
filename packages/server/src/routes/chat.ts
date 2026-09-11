import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ProjectOracleService } from '../services/chat/project-oracle-service.js';

export const chatRouter = Router();

const OracleQuestionSchema = z.object({
  question: z.string().min(1),
  context: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.enum(['image', 'pdf', 'document', 'audio']),
    dataUrl: z.string().optional(),
    extractedText: z.string().optional(),
    size: z.number().optional()
  })).optional(),
  conversationHistory: z.array(z.object({
    sender: z.enum(['user', 'oracle']),
    text: z.string()
  })).optional()
});

/**
 * POST /api/chat/ask-oracle
 * Interacts with the Project Oracle knowledgeable about the entire UNION.AI system.
 */
chatRouter.post('/ask-oracle', async (req: Request, res: Response) => {
  try {
    const data = OracleQuestionSchema.parse(req.body);
    const answer = await ProjectOracleService.answerQuestion(data);

    res.status(200).json({
      success: true,
      data: answer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query Project Oracle'
    });
  }
});
