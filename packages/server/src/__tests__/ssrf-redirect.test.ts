import { describe, it, expect, vi, afterEach } from 'vitest';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import * as guard from '../utils/ssrf-guard.js';
import { safeFetchText } from '../utils/safe-http.js';
afterEach(() => vi.restoreAllMocks());
describe('Pinned HTTP transport', () => {
  it('pins the validated DNS address and rejects a redirect to a private address', async () => {
    const realValidator = guard.validateSsrfTarget;
    vi.spyOn(guard, 'validateSsrfTarget').mockImplementation(url => url === 'https://fixture.example/' ? Promise.resolve({ safe: true, resolvedIp: '93.184.216.34' }) : realValidator(url));
    let pinned: unknown;
    const transport = vi.spyOn(https, 'request').mockImplementation(((url: unknown, options: any, callback: any) => {
      options.lookup('fixture.example', { all: true }, (_error: unknown, value: unknown) => { pinned = value; });
      const req = new EventEmitter() as any;
      req.end = () => callback({ statusCode: 302, headers: { location: 'http://127.0.0.1/private' }, resume() {} });
      return req;
    }) as any);
    await expect(safeFetchText('https://fixture.example/')).rejects.toThrow('SSRF_BLOCKED');
    expect(pinned).toEqual([{ address: '93.184.216.34', family: 4 }]);
    expect(transport).toHaveBeenCalledTimes(1);
  });
});
