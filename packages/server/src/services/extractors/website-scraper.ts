import { safeFetchText } from '../../utils/safe-http.js';
import { validateSsrfTarget } from '../../utils/ssrf-guard.js';
export interface WebScraperResult {
    url: string;
    title: string;
    description: string;
    author?: string;
    cleanText: string;
    wordCount: number;
    links: string[];
}
export class WebsiteScraper {
    /**
     * Sanitizes and parses HTML into clean structured text and metadata.
     */
    public static cleanHtml(html: string): {
        title: string;
        description: string;
        cleanText: string;
        links: string[];
    } {
        // 1. Extract Title
        let title = 'Web Page';
        const ogTitleMatch = html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
            title = ogTitleMatch[1].trim();
        }
        else if (titleTagMatch && titleTagMatch[1]) {
            title = titleTagMatch[1].replace(/\s+/g, ' ').trim();
        }
        // 2. Extract Description
        let description = '';
        const ogDescMatch = html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        const descMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        if (ogDescMatch && ogDescMatch[1]) {
            description = ogDescMatch[1].trim();
        }
        else if (descMatch && descMatch[1]) {
            description = descMatch[1].trim();
        }
        // 3. Extract Links
        const links: string[] = [];
        const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(html)) !== null) {
            const href = linkMatch[1].trim();
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                links.push(href);
            }
        }
        // 4. Clean Body Content
        // Strip scripts, styles, comments, svgs, header, nav, footer
        let cleaned = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
            .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
            .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
            .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
            .replace(/<!--[\s\S]*?-->/g, ' ');
        // Convert block elements to line breaks
        cleaned = cleaned
            .replace(/<\/(h[1-6]|p|div|section|article|li)>/gi, '\n')
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<[^>]+>/g, ' ') // Strip remaining tags
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'");
        // Condense extra blank lines and spaces
        const cleanText = cleaned
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .join('\n\n');
        return {
            title,
            description,
            cleanText,
            links: Array.from(new Set(links)).slice(0, 30) // cap to 30 unique links
        };
    }
    /**
     * Fetches URL and extracts structured clean content.
     */
    public static async scrape(url: string): Promise<WebScraperResult> {
        const trimmedUrl = url.trim();
        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
            throw new Error(`URL web inválida: "${url}". Deve iniciar com http:// ou https://`);
        }
        // SSRF Guard Check: Block private networks, loopback, and cloud metadata
        const ssrfCheck = await validateSsrfTarget(trimmedUrl);
        if (!ssrfCheck.safe) {
            throw new Error(`[SSRF_BLOCKED] Acesso negado: ${ssrfCheck.reason || 'Destino de rede restrito'}`);
        }
        try {
            const html = await safeFetchText(trimmedUrl);
            const parsed = this.cleanHtml(html);
            const words = parsed.cleanText.split(/\s+/).filter(Boolean);
            return {
                url: trimmedUrl,
                title: parsed.title,
                description: parsed.description,
                cleanText: parsed.cleanText,
                wordCount: words.length,
                links: parsed.links
            };
        }
        catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            if (message.includes('SSRF_BLOCKED')) {
                throw err;
            }
            throw new Error(`[EXTRACTION_FAILED] Não foi possível extrair o conteúdo da página web "${trimmedUrl}": ${message}`);
        }
    }
}
