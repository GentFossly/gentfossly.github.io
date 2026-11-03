import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildLogoManifest, generateLogoManifest } from './generate-logos.mjs';

async function createFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'logo-manifest-'));
  const logoDirectory = path.join(root, 'Gent Fossly logo');
  await mkdir(logoDirectory);
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, logoDirectory };
}

test('discovers any number of supported logo files and ignores other files', async (t) => {
  const { logoDirectory } = await createFixture(t);
  await writeFile(path.join(logoDirectory, 'Logo10.png'), '');
  await writeFile(path.join(logoDirectory, 'Logo2.svg'), '');
  await writeFile(path.join(logoDirectory, 'notes.txt'), '');
  await mkdir(path.join(logoDirectory, 'nested'));
  await writeFile(path.join(logoDirectory, 'nested', 'Logo3.png'), '');

  assert.deepEqual(await buildLogoManifest(logoDirectory), [
    'Gent%20Fossly%20logo/Logo2.svg',
    'Gent%20Fossly%20logo/Logo10.png'
  ]);
});

test('writes a manifest matching the current logo files', async (t) => {
  const { root, logoDirectory } = await createFixture(t);
  const outputPath = path.join(root, 'logos.json');
  await writeFile(path.join(logoDirectory, 'Logo1.png'), '');
  await writeFile(path.join(logoDirectory, 'Logo2.png'), '');

  await generateLogoManifest({ logoDirectory, outputPath });
  await rm(path.join(logoDirectory, 'Logo2.png'));
  await generateLogoManifest({ logoDirectory, outputPath });

  assert.deepEqual(JSON.parse(await readFile(outputPath, 'utf8')), [
    'Gent%20Fossly%20logo/Logo1.png'
  ]);
});
