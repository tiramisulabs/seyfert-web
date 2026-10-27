// Run after api:generate. Guards the composed Client API that used to be empty.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { URL } from 'node:url';
import fs from 'node:fs/promises';
import ts from 'typescript';

async function generatedEntries(file, exportName) {
  const source = await fs.readFile(new URL(`../lib/api-reference/${file}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const generated = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
  return generated[exportName];
}

const aliases = await generatedEntries('details/type-aliases.ts', 'apiEntryDetails');
const classes = await generatedEntries('details/classes.ts', 'apiEntryDetails');
const client = aliases['Client:TypeAlias'];
assert.ok(client, 'Client instance reference must exist');
for (const name of ['gateway', 'events', 'start', 'rest', 'cache', 'close', 'uploadCommands']) {
  assert.ok(client.members.some((member) => member.name === name), `Missing public Client member: ${name}`);
}
for (const name of ['execute', 'onPacket', 'onShardDisconnect', '_applicationId', 'pluginsSetupPromise']) {
  assert.ok(!client.members.some((member) => member.name === name), `Non-public Client member exposed: ${name}`);
}
assert.ok(classes['CommandContext:Class'].members.some((member) => member.name === 'write'), 'Merged class/interface members must remain available');
const manifest = await generatedEntries('generated.ts', 'apiEntries');
const page = await fs.readFile(new URL('../app/docs/api/[[...apiSlug]]/page.tsx', import.meta.url), 'utf8');
const featured = page.match(/const featuredSlugs = \[([\s\S]*?)\];/)[1];
for (const [, slug] of featured.matchAll(/'([^']+)'/g)) {
  assert.ok(manifest.some((entry) => entry.slug === slug), `Featured destination does not exist: ${slug}`);
}
console.log('API reference: composed Client, public visibility, merged context and featured destinations passed.');
