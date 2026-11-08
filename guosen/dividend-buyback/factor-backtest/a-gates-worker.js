'use strict';
importScripts('./a-gates-core.js?v=20261108-1');
const cache = new Map();
async function load(path, files) {
  const info = files[path];if (!info) throw Error('缺少已核验的数据分块：' + path);
  const key = path + ':' + info.sha256;if (cache.has(key)) return cache.get(key);
  const task = (async () => {const res = await fetch('./' + path + '?v=' + info.sha256.slice(0, 12));if (!res.ok) throw Error('行情加载失败，请重试');const raw = await res.arrayBuffer();
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', raw))].map(x => x.toString(16).padStart(2, '0')).join('');
    if (raw.byteLength !== info.bytes || hash !== info.sha256) throw Error('行情版本校验失败，未计算收益');
    return JSON.parse(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).text());})();
  cache.set(key, task);try {return await task;} catch (e) {cache.delete(key);throw e;}
}
self.onmessage = async ({data: x}) => {
  try {
    const meta = await load('inputs/gates/meta.json.gz', x.files);if (meta.fingerprint !== x.fingerprint) throw Error('门槛与行情版本不一致');
    if (x.pools.length !== meta.periods.length) throw Error('调仓期间不一致');
    const wanted = new Set(x.pools.flat()), chunks = meta.chunks.filter(c => c.codes.some(k => wanted.has(k))), quotes = {};
    // Limit network/decompression concurrency on mobile devices.
    for (let i = 0; i < chunks.length; i += 3) {
      const packs = await Promise.all(chunks.slice(i, i + 3).map(c => load(c.file, x.files)));
      for (const pack of packs) for (const r of pack) if (wanted.has(r[0])) quotes[r[0]] = r;
      self.postMessage({id: x.id, progress: Math.min(i + 3, chunks.length), total: chunks.length});
    }
    const result = AGateCore.run(meta, x.pools, quotes, {mask: x.mask, steps: x.steps, signature: x.signature});
    self.postMessage({id: x.id, result});
  } catch (e) {self.postMessage({id: x.id, error: e.message});}
};
