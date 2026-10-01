import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createDataPacket, DataPacket } from '@union/shared';
export interface ExtractedDocumentResult {
    text: string;
    pageCount: number;
    pages: {
        pageNumber: number;
        text: string;
        wordCount: number;
    }[];
    metadata: {
        title?: string;
        author?: string;
        creationDate?: string;
        fileSize: number;
        filename?: string;
        mimeType: string;
    };
    tables: {
        headers: string[];
        rows: string[][];
    }[];
}
export class PdfExtractorService {
    /**
     * Parses document text / buffer / simulated PDF data into structured content
     */
    public async parseDocument(content: string | Buffer, filename: string = 'document.pdf', mimeType: string = 'application/pdf'): Promise<ExtractedDocumentResult> {
        let rawText: string;
        let fileSize = 0;
        if (Buffer.isBuffer(content)) {
            fileSize = content.length;
            rawText = content.toString('utf-8');
        }
        else {
            fileSize = Buffer.byteLength(content, 'utf-8');
            rawText = content;
        }
        if (Buffer.isBuffer(content) && content.subarray(0, 5).toString() === '%PDF-') {
            if (content.length > 10 * 1024 * 1024)
                throw new Error('PDF_TOO_LARGE');
            const task = getDocument({ data: new Uint8Array(content), useSystemFonts: true });
            try {
                const document = await task.promise;
                if (document.numPages > 500) throw new Error('PDF_TOO_MANY_PAGES');
                const pages = [];
                for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
                    const page = await document.getPage(pageNumber);
                    const extracted = await page.getTextContent();
                    const text = extracted.items.map(item => 'str' in item ? item.str : '').join(' ').trim();
                    pages.push({ pageNumber, text, wordCount: text ? text.split(/\s+/).length : 0 });
                    page.cleanup();
                }
                const metadata = await document.getMetadata();
                const info = metadata.info as { Title?: string; Author?: string };
                return { text: pages.map(page => page.text).join('\n\n'), pageCount: document.numPages, pages,
                    metadata: { title: info.Title || filename, author: info.Author, fileSize: content.length, filename, mimeType }, tables: [] };
            } finally { await task.destroy(); }
        }
        if (Buffer.isBuffer(content) && mimeType === 'application/pdf')
            throw new Error('INVALID_PDF');
        // Clean text
        const normalizedText = rawText.replace(/\r\n/g, '\n').trim();
        // Split pages based on form feeds (\f), page markers, or synthetic 500-word blocks
        let rawPages = normalizedText.split(/\f|<!--\s*pagebreak\s*-->|=== PAGE \d+ ===/i);
        if (rawPages.length === 1 && rawPages[0].length > 3000) {
            // Synthetic page chunking for long monolithic text
            const words = rawPages[0].split(/\s+/);
            const chunkSize = 400;
            const chunks: string[] = [];
            for (let i = 0; i < words.length; i += chunkSize) {
                chunks.push(words.slice(i, i + chunkSize).join(' '));
            }
            rawPages = chunks.length > 0 ? chunks : rawPages;
        }
        const pages = rawPages.map((pText, index) => {
            const trimmed = pText.trim();
            const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
            return {
                pageNumber: index + 1,
                text: trimmed,
                wordCount: words
            };
        });
        // Detect markdown tables or CSV-style table structures inside text
        const tables = this.extractTables(normalizedText);
        return {
            text: normalizedText,
            pageCount: pages.length,
            pages,
            metadata: {
                title: filename.replace(/\.[^/.]+$/, ''),
                fileSize,
                filename,
                mimeType
            },
            tables
        };
    }
    /**
     * Helper to convert an extraction result into standard UNION.AI DataPackets
     */
    public toDataPackets(result: ExtractedDocumentResult, sourceNodeId: string): DataPacket[] {
        const packets: DataPacket[] = [];
        // Document packet
        packets.push(createDataPacket({
            type: 'DOCUMENT',
            originNodeId: sourceNodeId,
            tokens: 0,
            processingTimeMs: 15,
            creditsCost: 0,
            payload: {
                text: result.text,
                pageCount: result.pageCount,
                pages: result.pages,
                metadata: result.metadata
            }
        }));
        // Text packet for easy piping to LLM/Marketing nodes
        packets.push(createDataPacket({
            type: 'TEXT',
            originNodeId: sourceNodeId,
            tokens: 0,
            processingTimeMs: 10,
            creditsCost: 0,
            payload: result.text
        }));
        // Table packets if any extracted
        if (result.tables.length > 0) {
            packets.push(createDataPacket({
                type: 'TABLE',
                originNodeId: sourceNodeId,
                tokens: 0,
                processingTimeMs: 5,
                creditsCost: 0,
                payload: {
                    tables: result.tables
                }
            }));
        }
        return packets;
    }
    private extractTables(text: string): {
        headers: string[];
        rows: string[][];
    }[] {
        const tables: {
            headers: string[];
            rows: string[][];
        }[] = [];
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let currentHeaders: string[] | null = null;
        let currentRows: string[][] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // A table line must start with | or contain multiple |
            if (line.includes('|')) {
                const parts = line
                    .split('|')
                    .map(c => c.trim())
                    .filter((c, idx, arr) => {
                    // Drop empty edges from leading/trailing pipes
                    if ((idx === 0 || idx === arr.length - 1) && c === '')
                        return false;
                    return true;
                });
                if (parts.length >= 2) {
                    // Check if this line is a separator like |---|---|
                    const isSeparator = parts.every(p => /^[-:]+$/.test(p));
                    if (isSeparator) {
                        continue;
                    }
                    if (!currentHeaders) {
                        currentHeaders = parts;
                        currentRows = [];
                    }
                    else {
                        currentRows.push(parts);
                    }
                    continue;
                }
            }
            // Line does not look like a table row
            if (currentHeaders && currentRows.length > 0) {
                tables.push({ headers: currentHeaders, rows: currentRows });
                currentHeaders = null;
                currentRows = [];
            }
            else {
                currentHeaders = null;
                currentRows = [];
            }
        }
        if (currentHeaders && currentRows.length > 0) {
            tables.push({ headers: currentHeaders, rows: currentRows });
        }
        return tables;
    }
}
