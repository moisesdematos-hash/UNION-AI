import ipaddr from 'ipaddr.js';
import dns from 'dns';
import { promisify } from 'util';
import net from 'net';
const lookupAsync = promisify(dns.lookup);
/**
 * Checks whether an IPv4 address is in a private, loopback, or reserved range.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
    try {
        return ipaddr.process(ip).range() !== 'unicast';
    }
    catch {
        return true;
    }
}
export function isPrivateOrReservedIPv6(ip: string): boolean {
    try {
        return ipaddr.process(ip).range() !== 'unicast';
    }
    catch {
        return true;
    }
}
export interface SsrfCheckResult {
    safe: boolean;
    resolvedIp?: string;
    reason?: string;
}
/**
 * Validates a target URL against SSRF attacks:
 * 1. Protocol must be http: or https:
 * 2. Hostname cannot be localhost, cloud metadata, or internal domains
 * 3. Resolves DNS to check underlying IP is not private, loopback, or cloud metadata
 */
export async function validateSsrfTarget(targetUrl: string): Promise<SsrfCheckResult> {
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(targetUrl);
    }
    catch {
        return { safe: false, reason: 'URL malformada ou inválida' };
    }
    // Protocol check
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return { safe: false, reason: `Protocolo "${parsedUrl.protocol}" não permitido. Apenas HTTP e HTTPS são suportados.` };
    }
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    // Blocked hostnames
    const blockedHostnames = [
        'localhost',
        'metadata.google.internal',
        'instance-data',
        '169.254.169.254'
    ];
    if (blockedHostnames.includes(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
        return { safe: false, reason: `Destino bloqueado por políticas de segurança SSRF: ${hostname}` };
    }
    // Check if hostname is already a raw IP
    if (net.isIP(hostname)) {
        if (net.isIPv4(hostname) && isPrivateOrReservedIPv4(hostname)) {
            return { safe: false, resolvedIp: hostname, reason: `Endereço IP restrito/privado detectado: ${hostname}` };
        }
        if (net.isIPv6(hostname) && isPrivateOrReservedIPv6(hostname)) {
            return { safe: false, resolvedIp: hostname, reason: `Endereço IPv6 restrito/privado detectado: ${hostname}` };
        }
        return { safe: true, resolvedIp: hostname };
    }
    // Resolve DNS to verify the target IP is not an internal network or cloud metadata address
    try {
        const lookup = await lookupAsync(hostname, { all: true });
        for (const record of lookup) {
            if (record.family === 4 && isPrivateOrReservedIPv4(record.address)) {
                return { safe: false, resolvedIp: record.address, reason: `Hostname ${hostname} resolve para IP restrito: ${record.address}` };
            }
            if (record.family === 6 && isPrivateOrReservedIPv6(record.address)) {
                return { safe: false, resolvedIp: record.address, reason: `Hostname ${hostname} resolve para IPv6 restrito: ${record.address}` };
            }
        }
        const primaryIp = lookup[0]?.address;
        return { safe: true, resolvedIp: primaryIp };
    }
    catch (err: any) {
        return { safe: false, reason: `Falha ao resolver DNS para "${hostname}": ${err.message || 'Host desconhecido'}` };
    }
}
