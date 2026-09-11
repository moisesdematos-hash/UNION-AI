import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { YouTubeExtractor } from '../services/extractors/youtube-extractor.js';
import { WebsiteScraper } from '../services/extractors/website-scraper.js';
import { DocumentParser } from '../services/extractors/document-parser.js';
import { TextExtractor } from '../services/extractors/text-extractor.js';
import { createDataPacket } from '@union/shared';

export const extractorsRouter = Router();

const YouTubeRequestSchema = z.object({
  url: z.string().min(1),
  originNodeId: z.string().optional()
});

const WebsiteRequestSchema = z.object({
  url: z.string().min(1),
  originNodeId: z.string().optional()
});

const DocumentRequestSchema = z.object({
  content: z.string().min(1),
  fileName: z.string().default('document.pdf'),
  pageRange: z.string().default('all'),
  originNodeId: z.string().optional()
});

const TextRequestSchema = z.object({
  text: z.string().min(1),
  originNodeId: z.string().optional()
});

// POST /api/extractors/youtube
extractorsRouter.post('/youtube', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { url, originNodeId } = YouTubeRequestSchema.parse(req.body);
    const result = await YouTubeExtractor.extract(url);
    const processingTimeMs = Date.now() - startTime;

    // Create DataPackets for the different outputs
    const transcriptPacket = createDataPacket({
      type: 'TRANSCRIPT',
      payload: result.transcript,
      originNodeId,
      tokens: result.wordCount,
      processingTimeMs,
      creditsCost: 0.01
    });

    const metadataPacket = createDataPacket({
      type: 'METADATA',
      payload: result.metadata,
      originNodeId,
      processingTimeMs,
      creditsCost: 0
    });

    const textPacket = createDataPacket({
      type: 'TEXT',
      payload: result.fullText,
      originNodeId,
      tokens: result.wordCount,
      processingTimeMs,
      creditsCost: 0.01
    });

    res.status(200).json({
      status: 'success',
      data: {
        raw: result,
        packets: {
          transcript: transcriptPacket,
          metadata: metadataPacket,
          text: textPacket
        }
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao extrair vídeo do YouTube';
    res.status(400).json({ status: 'error', message });
  }
});

// POST /api/extractors/website
extractorsRouter.post('/website', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { url, originNodeId } = WebsiteRequestSchema.parse(req.body);
    const result = await WebsiteScraper.scrape(url);
    const processingTimeMs = Date.now() - startTime;

    const textPacket = createDataPacket({
      type: 'TEXT',
      payload: result.cleanText,
      originNodeId,
      tokens: result.wordCount,
      processingTimeMs,
      creditsCost: 0.005
    });

    const metadataPacket = createDataPacket({
      type: 'METADATA',
      payload: {
        title: result.title,
        description: result.description,
        links: result.links
      },
      originNodeId,
      processingTimeMs,
      creditsCost: 0
    });

    res.status(200).json({
      status: 'success',
      data: {
        raw: result,
        packets: {
          text: textPacket,
          metadata: metadataPacket
        }
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao rastrear página web';
    res.status(400).json({ status: 'error', message });
  }
});

// POST /api/extractors/pdf
extractorsRouter.post('/pdf', (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { content, fileName, pageRange, originNodeId } = DocumentRequestSchema.parse(req.body);
    const result = DocumentParser.parse(content, fileName, pageRange);
    const processingTimeMs = Date.now() - startTime;

    const textPacket = createDataPacket({
      type: 'TEXT',
      payload: result.cleanText,
      originNodeId,
      tokens: result.wordCount,
      processingTimeMs,
      creditsCost: 0.005
    });

    const documentPacket = createDataPacket({
      type: 'DOCUMENT',
      payload: {
        title: result.title,
        fileName: result.fileName,
        pageCount: result.pageCount,
        characterCount: result.characterCount,
        tables: result.tables
      },
      originNodeId,
      processingTimeMs,
      creditsCost: 0
    });

    res.status(200).json({
      status: 'success',
      data: {
        raw: result,
        packets: {
          text: textPacket,
          document: documentPacket
        }
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao processar documento';
    res.status(400).json({ status: 'error', message });
  }
});

// POST /api/extractors/text
extractorsRouter.post('/text', (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { text, originNodeId } = TextRequestSchema.parse(req.body);
    const result = TextExtractor.extract(text);
    const processingTimeMs = Date.now() - startTime;

    const textPacket = createDataPacket({
      type: 'TEXT',
      payload: result.cleanText,
      originNodeId,
      tokens: result.estimatedTokens,
      processingTimeMs,
      creditsCost: 0
    });

    res.status(200).json({
      status: 'success',
      data: {
        raw: result,
        packets: {
          text: textPacket
        }
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao processar texto';
    res.status(400).json({ status: 'error', message });
  }
});
