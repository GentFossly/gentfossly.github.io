import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildProjects, generateProjects } from './generate-projects.mjs';

async function createFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'portfolio-manifest-'));
  const imagesDirectory = path.join(root, 'images');
  await mkdir(imagesDirectory);
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, imagesDirectory };
}

test('uses the cover for the card and excludes it from naturally ordered gallery media', async (t) => {
  const { imagesDirectory } = await createFixture(t);
  const projectDirectory = path.join(imagesDirectory, 'Open Up');
  await mkdir(projectDirectory);
  await writeFile(path.join(projectDirectory, '10-detail.mp4'), '');
  await writeFile(path.join(projectDirectory, '02-closed.JPG'), '');
  await writeFile(path.join(projectDirectory, 'cover.jpeg'), '');
  await writeFile(path.join(projectDirectory, 'notes.txt'), '');
  await mkdir(path.join(projectDirectory, 'extras'));
  await mkdir(path.join(imagesDirectory, 'Empty Project'));
  await writeFile(path.join(imagesDirectory, 'loose-image.jpg'), '');

  const projects = await buildProjects(imagesDirectory);

  assert.deepEqual(projects, [{
    title: 'Open Up',
    subtitle: 'Artwork study',
    cover: 'images/Open%20Up/cover.jpeg',
    media: [
      { type: 'image', src: 'images/Open%20Up/02-closed.JPG', alt: 'Open Up — 02 closed' },
      { type: 'video', src: 'images/Open%20Up/10-detail.mp4' }
    ]
  }]);
});

test('requires exactly one supported cover image for any folder containing media', async (t) => {
  const { imagesDirectory } = await createFixture(t);
  const projectDirectory = path.join(imagesDirectory, 'Missing Cover');
  await mkdir(projectDirectory);
  await writeFile(path.join(projectDirectory, '01-art.png'), '');

  await assert.rejects(
    buildProjects(imagesDirectory),
    /Project "Missing Cover" must contain exactly one cover image/
  );

  await writeFile(path.join(projectDirectory, 'cover.jpg'), '');
  await writeFile(path.join(projectDirectory, 'cover.webp'), '');
  await assert.rejects(
    buildProjects(imagesDirectory),
    /found 2/
  );
});

test('keeps cover-only projects but leaves their gallery empty', async (t) => {
  const { imagesDirectory } = await createFixture(t);
  const projectDirectory = path.join(imagesDirectory, 'Cover Only');
  await mkdir(projectDirectory);
  await writeFile(path.join(projectDirectory, 'cover.jpeg'), '');

  const [project] = await buildProjects(imagesDirectory);

  assert.equal(project.cover, 'images/Cover%20Only/cover.jpeg');
  assert.deepEqual(project.media, []);
});

test('writes a parseable JSON manifest to the requested output path', async (t) => {
  const { root, imagesDirectory } = await createFixture(t);
  const projectDirectory = path.join(imagesDirectory, 'A Project');
  const outputPath = path.join(root, 'projects.json');
  await mkdir(projectDirectory);
  await writeFile(path.join(projectDirectory, 'cover.png'), '');

  const projects = await generateProjects({ imagesDirectory, outputPath });
  const writtenManifest = JSON.parse(await readFile(outputPath, 'utf8'));

  assert.deepEqual(writtenManifest, projects);
  assert.equal(writtenManifest.length, 1);
});
