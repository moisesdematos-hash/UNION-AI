import { describe, it, expect } from 'vitest';
import { PdfExtractorService } from '../services/extractors/pdf-extractor.js';
describe('PdfExtractorService', () => {
    const service = new PdfExtractorService();
    it('should parse plain text document into pages, metadata and word count', async () => {
        const text = 'Esta é a primeira página do documento com informações importantes.\fEsta é a segunda página com termos de adesão e regras do funil.';
        const result = (await service.parseDocument(text, 'proposta-comercial.pdf'));
        expect(result.pageCount).toBe(2);
        expect(result.pages).toHaveLength(2);
        expect(result.pages[0].pageNumber).toBe(1);
        expect(result.pages[1].pageNumber).toBe(2);
        expect(result.metadata.title).toBe('proposta-comercial');
        expect(result.metadata.filename).toBe('proposta-comercial.pdf');
        expect(result.text).toContain('primeira página');
    });
    it('should detect and extract markdown tables from document text', async () => {
        const content = `
# Resumo de Planos e Métricas

| Plano | Preço | Leads |
| Starter | R$ 97 | 1.000 |
| Pro | R$ 297 | 10.000 |
| Enterprise | R$ 997 | Ilimitado |

Fim do documento.
    `;
        const result = (await service.parseDocument(content, 'planos.pdf'));
        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].headers).toEqual(['Plano', 'Preço', 'Leads']);
        expect(result.tables[0].rows).toHaveLength(3);
        expect(result.tables[0].rows[0]).toEqual(['Starter', 'R$ 97', '1.000']);
    });
    it('should convert extracted document result into valid DataPackets', async () => {
        const text = 'Conteúdo do briefing para conversão no canvas UNION.AI';
        const result = (await service.parseDocument(text, 'briefing.pdf'));
        const packets = service.toDataPackets(result, 'node-pdf-1');
        expect(packets.length).toBeGreaterThanOrEqual(2); // DOCUMENT and TEXT packets
        const docPacket = packets.find(p => p.type === 'DOCUMENT');
        const textPacket = packets.find(p => p.type === 'TEXT');
        expect(docPacket).toBeDefined();
        expect(docPacket?.metadata.originNodeId).toBe('node-pdf-1');
        expect(textPacket).toBeDefined();
        expect((textPacket?.payload as any)).toContain('Conteúdo do briefing');
    });
});

it('extracts text from an actual compressed binary PDF, not UTF-8 interpretation', async () => {
  const { readFile } = await import('node:fs/promises');
  const buffer = await readFile(new URL('./fixtures/real-document.pdf', import.meta.url));
  const result = await new PdfExtractorService().parseDocument(buffer, 'real-document.pdf');
  expect(result.text).toContain('UNION AI real compressed PDF fixture');
  expect(result.pageCount).toBe(1);
  expect(result.text).not.toContain('%PDF-');
});
