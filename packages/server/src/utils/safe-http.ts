import http from 'node:http';
import https from 'node:https';
import { validateSsrfTarget } from './ssrf-guard.js';
/** Validate and pin DNS on every redirect. Never fetch a separately re-resolved host. */
export async function safeFetchText(target: string, remaining = 5): Promise<string> {
    if (remaining < 0)
        throw new Error('HTTP_REDIRECT_LIMIT');
    const url = new URL(target);
    if (url.username || url.password || (url.port && !['80', '443'].includes(url.port)))
        throw new Error('HTTP_TARGET_NOT_ALLOWED');
    const check = await validateSsrfTarget(target);
    if (!check.safe || !check.resolvedIp)
        throw new Error(`[SSRF_BLOCKED] ${check.reason || 'Destino inválido'}`);
    const result = await new Promise<{
        redirect?: string;
        text?: string;
    }>((resolve, reject) => {
        const transport = url.protocol === 'https:' ? https : http;
        const request = transport.request(url, {
            method: 'GET', timeout: 10000,
            lookup: (_host, options: any, callback: any) => {
        const family = check.resolvedIp!.includes(':') ? 6 : 4;
        if (options.all) callback(null, [{ address: check.resolvedIp, family }]);
        else callback(null, check.resolvedIp, family);
      },
            headers: { 'User-Agent': 'UNION-AI-Crawler/1.0', Accept: 'text/html,application/json,text/plain,*/*' }
        }, response => {
            if ([301, 302, 303, 307, 308].includes(response.statusCode || 0) && response.headers.location) {
                response.resume();
                resolve({ redirect: new URL(response.headers.location, url).toString() });
                return;
            }
            if ((response.statusCode || 500) >= 400) {
                response.resume();
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            const chunks: Buffer[] = [];
            let length = 0;
            response.on('data', chunk => {
                length += chunk.length;
                if (length > 2 * 1024 * 1024) {
                    response.destroy(new Error('HTTP_RESPONSE_TOO_LARGE'));
                    return;
                }
                chunks.push(chunk);
            });
            response.on('error', reject);
            response.on('end', () => resolve({ text: Buffer.concat(chunks).toString('utf8') }));
        });
        request.on('timeout', () => request.destroy(new Error('HTTP_TIMEOUT')));
        request.on('error', reject);
        request.end();
    });
    return result.redirect ? (await safeFetchText(result.redirect, remaining - 1)) : result.text || '';
}
