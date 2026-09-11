import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ProjectOracleService } from '../services/chat/project-oracle-service.js';

export const chatRouter = Router();

const OracleQuestionSchema = z.object({
  question: z.string().min(1),
  context: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
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

/**
 * GET /api/chat/history/:sessionId
 * Retrieves chat history and active memories for a session.
 */
chatRouter.get('/history/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const history = ProjectOracleService.getSessionHistory(sessionId);
    const memories = ProjectOracleService.getSessionMemories(sessionId);

    res.status(200).json({
      success: true,
      data: {
        messages: history,
        memories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve chat history'
    });
  }
});

/**
 * GET /api/chat/memories/:sessionId
 * Retrieves stored persistent memories for a session.
 */
chatRouter.get('/memories/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const memories = ProjectOracleService.getSessionMemories(sessionId);

    res.status(200).json({
      success: true,
      data: memories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve memories'
    });
  }
});

/**
 * POST /api/chat/clear-history
 * Wipes out all conversation history and retained memories for a session.
 */
chatRouter.post('/clear-history', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      ProjectOracleService.clearSession(sessionId);
    }

    res.status(200).json({
      success: true,
      message: 'Chat history and session memory cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear chat history'
    });
  }
});
