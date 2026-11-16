import assert from 'node:assert/strict';

async function request(path, status = 200) {
  const response = await fetch(`http://127.0.0.1:3000${path}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, status, `${path}: HTTP ${response.status}`);
  return response;
}

const home = await (await request('/')).text();
assert.match(home, /Seyfert/);
await request('/docs/learn/getting-started');
await request('/blog');
await request('/benchmark');
await request('/docs/this-page-does-not-exist', 404);
assert.equal((await request('/docs', 308)).headers.get('location'), '/docs/learn/getting-started');
const results = await (await request('/api/search?query=Client&limit=3')).json();
assert.ok(results.length > 0 && results.length <= 3);
const entry = results.find(result => result.url.startsWith('/docs/api/Client:'));
assert.ok(entry, 'Search must return a Client API entry');
await request(entry.url);
assert.deepEqual(await (await request('/api/search?query=')).json(), []);
const embed = await (await request('/discord-embed.json')).json();
assert.equal(embed.component.type, 17);
if (process.env.DEPLOYMENT_ENV === 'preview') {
  assert.match(home, /<meta name="robots" content="noindex, nofollow"/);
  assert.match(home, new RegExp(`${process.env.SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/discord-embed.json`));
  assert.equal(embed.component.components[0].items[0].media.url, `${process.env.SITE_URL}/opengraph-image.png`);
}
const image = await request('/_next/image?url=%2Fopengraph-image.png&w=640&q=75');
assert.match(image.headers.get('content-type'), /^image\//);
const assets = [...home.matchAll(/(?:src|href)="(\/_next\/static\/[^"<>]+)"/g)].map(match => match[1]);
const script = assets.find(asset => /\.js(?:\?|$)/.test(asset));
const stylesheet = assets.find(asset => /\.css(?:\?|$)/.test(asset));
assert.ok(script && stylesheet);
await request(script);
await request(stylesheet);
console.log('PASS: pages, search, redirects, embeds, image optimization and static assets');
