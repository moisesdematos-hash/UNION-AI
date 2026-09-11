import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { DataPacketSchema } from '@union/shared';

describe('Extractors API (/api/extractors)', () => {
  const app = createApp();
  describe('POST /api/extractors/youtube', () => {
    it('should extract metadata and transcript from a valid YouTube URL and return typed DataPackets', async () => {
      const res = await request(app)
        .post('/api/extractors/youtube')
        .send({
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          originNodeId: 'node-yt-1'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();

      const { raw, packets } = res.body.data;
      expect(raw.metadata).toBeDefined();
      expect(raw.metadata.videoId).toBe('dQw4w9WgXcQ');
      expect(raw.transcript).toBeInstanceOf(Array);
      expect(raw.transcript.length).toBeGreaterThan(0);
      expect(raw.fullText).toBeDefined();

      // Validate DataPackets
      expect(packets.transcript).toBeDefined();
      expect(packets.metadata).toBeDefined();
      expect(packets.text).toBeDefined();

      expect(() => DataPacketSchema.parse(packets.transcript)).not.toThrow();
      expect(() => DataPacketSchema.parse(packets.metadata)).not.toThrow();
      expect(() => DataPacketSchema.parse(packets.text)).not.toThrow();

      expect(packets.transcript.type).toBe('TRANSCRIPT');
      expect(packets.transcript.metadata.originNodeId).toBe('node-yt-1');
      expect(packets.metadata.type).toBe('METADATA');
      expect(packets.text.type).toBe('TEXT');
    }, 30000);

    it('should extract from youtu.be short URL format', async () => {
      const res = await request(app)
        .post('/api/extractors/youtube')
        .send({
          url: 'https://youtu.be/dQw4w9WgXcQ'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.raw.metadata.videoId).toBe('dQw4w9WgXcQ');
    }, 30000);

    it('should return 400 for invalid YouTube URL', async () => {
      const res = await request(app)
        .post('/api/extractors/youtube')
        .send({
          url: 'https://example.com/not-a-video'
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/URL inválida do YouTube/i);
    });

    it('should return 400 if url is missing', async () => {
      const res = await request(app)
        .post('/api/extractors/youtube')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/extractors/website', () => {
    it('should scrape website and return clean text, metadata, and DataPackets', async () => {
      const res = await request(app)
        .post('/api/extractors/website')
        .send({
          url: 'https://example.com',
          originNodeId: 'node-web-1'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();

      const { raw, packets } = res.body.data;
      expect(raw.url).toBe('https://example.com');
      expect(raw.title).toBeDefined();
      expect(raw.cleanText).toBeDefined();
      expect(raw.wordCount).toBeGreaterThan(0);

      // Validate DataPackets
      expect(packets.text).toBeDefined();
      expect(packets.metadata).toBeDefined();
      expect(() => DataPacketSchema.parse(packets.text)).not.toThrow();
      expect(() => DataPacketSchema.parse(packets.metadata)).not.toThrow();

      expect(packets.text.type).toBe('TEXT');
      expect(packets.text.metadata.originNodeId).toBe('node-web-1');
      expect(packets.metadata.type).toBe('METADATA');
    });

    it('should reject invalid URL not starting with http/https', async () => {
      const res = await request(app)
        .post('/api/extractors/website')
        .send({
          url: 'ftp://files.example.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/URL web inválida/i);
    });
  });

  describe('POST /api/extractors/pdf', () => {
    it('should parse document content and extract tables and clean text', async () => {
      const sampleDoc = `
# Executive Summary
UNION.AI is an autonomous marketing operating system.

| Metric | Target | Actual |
| --- | --- | --- |
| Velocity | 10x | 12x |
| Retention | 95% | 98% |

Key takeaways and operational roadmap.
      `.trim();

      const res = await request(app)
        .post('/api/extractors/pdf')
        .send({
          content: sampleDoc,
          fileName: 'report-q3.pdf',
          originNodeId: 'node-pdf-1'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();

      const { raw, packets } = res.body.data;
      expect(raw.fileName).toBe('report-q3.pdf');
      expect(raw.tables.length).toBe(2);
      expect(raw.tables[0]['Metric']).toBe('Velocity');
      expect(raw.tables[0]['Target']).toBe('10x');
      expect(raw.tables[0]['Actual']).toBe('12x');

      // Validate DataPackets
      expect(packets.text).toBeDefined();
      expect(packets.document).toBeDefined();
      expect(() => DataPacketSchema.parse(packets.text)).not.toThrow();
      expect(() => DataPacketSchema.parse(packets.document)).not.toThrow();

      expect(packets.text.type).toBe('TEXT');
      expect(packets.text.metadata.originNodeId).toBe('node-pdf-1');
      expect(packets.document.type).toBe('DOCUMENT');
    });

    it('should return 400 if content is missing', async () => {
      const res = await request(app)
        .post('/api/extractors/pdf')
        .send({
          fileName: 'empty.pdf'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/extractors/text', () => {
    it('should extract lexical metrics and return TEXT DataPacket', async () => {
      const text = 'UNION.AI transforms ideas into high-converting digital assets with real data flow and AI routing.';
      const res = await request(app)
        .post('/api/extractors/text')
        .send({
          text,
          originNodeId: 'node-text-1'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();

      const { raw, packets } = res.body.data;
      expect(raw.cleanText).toBe(text);
      expect(raw.wordCount).toBeGreaterThan(10);
      expect(raw.estimatedTokens).toBeGreaterThan(0);
      expect(raw.readingTimeMinutes).toBeGreaterThan(0);

      // Validate DataPacket
      expect(packets.text).toBeDefined();
      expect(() => DataPacketSchema.parse(packets.text)).not.toThrow();
      expect(packets.text.type).toBe('TEXT');
      expect(packets.text.metadata.originNodeId).toBe('node-text-1');
      expect(packets.text.payload).toBe(text);
    });

    it('should return 400 if text is empty', async () => {
      const res = await request(app)
        .post('/api/extractors/text')
        .send({
          text: ''
        });

      expect(res.status).toBe(400);
    });
  });
});
