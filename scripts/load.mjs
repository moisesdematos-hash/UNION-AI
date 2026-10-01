// Run only against a deployment you are authorized to test. Default is local.
const base = process.env.LOAD_BASE_URL || 'http://127.0.0.1:4000';
const token = process.env.LOAD_AUTH_TOKEN;
if (!token) throw new Error('LOAD_AUTH_TOKEN is required; no public liveness-only benchmark');
const concurrency = Number(process.env.LOAD_CONCURRENCY || 10);
const count = Number(process.env.LOAD_REQUESTS || 100);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100 || !Number.isInteger(count) || count < 1 || count > 10000) throw new Error('Invalid load limits');
const latencies = []; let next = 0, errors = 0;
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (next++ < count) {
    const start = performance.now();
    try {
      const response = await fetch(`${base}/api/projects`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) errors++;
      await response.arrayBuffer();
    } catch { errors++; }
    latencies.push(performance.now() - start);
  }
}));
latencies.sort((a, b) => a - b);
const percentile = fraction => latencies[Math.ceil(latencies.length * fraction) - 1];
console.log(JSON.stringify({ requests: latencies.length, concurrency, errors, p50Ms: percentile(0.5), p95Ms: percentile(0.95), p99Ms: percentile(0.99) }, null, 2));
if (errors) process.exitCode = 1;
