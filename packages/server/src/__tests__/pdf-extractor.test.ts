import { describe, it, expect } from 'vitest';
import { PdfExtractorService } from '../services/extractors/pdf-extractor.js';

describe('PdfExtractorService', () => {
  const service = new PdfExtractorService();

  it('should parse plain text document into pages, metadata and word count', () => {
    const text = 'Esta é a primeira página do documento com informações importantes.\fEsta é a segunda página com termos de adesão e regras do funil.';
    const result = service.parseDocument(text, 'proposta-comercial.pdf');

    expect(result.pageCount).toBe(2);
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.pages[1].pageNumber).toBe(2);
    expect(result.metadata.title).toBe('proposta-comercial');
    expect(result.metadata.filename).toBe('proposta-comercial.pdf');
    expect(result.text).toContain('primeira página');
  });

  it('should detect and extract markdown tables from document text', () => {
    const content = `
# Resumo de Planos e Métricas

| Plano | Preço | Leads |
| Starter | R$ 97 | 1.000 |
| Pro | R$ 297 | 10.000 |
| Enterprise | R$ 997 | Ilimitado |

Fim do documento.
    `;

    const result = service.parseDocument(content, 'planos.pdf');
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].headers).toEqual(['Plano', 'Preço', 'Leads']);
    expect(result.tables[0].rows).toHaveLength(3);
    expect(result.tables[0].rows[0]).toEqual(['Starter', 'R$ 97', '1.000']);
  });

  it('should convert extracted document result into valid DataPackets', () => {
    const text = 'Conteúdo do briefing para conversão no canvas UNION.AI';
    const result = service.parseDocument(text, 'briefing.pdf');
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
