import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const SCRIPT_PATH = fileURLToPath(import.meta.url);

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }) || a.localeCompare(b);
}

function encodePath(relativePath) {
  return relativePath.split(path.sep).map(encodeURIComponent).join('/');
}

export async function buildLogoManifest(logoDirectory) {
  const files = await readdir(logoDirectory, { withFileTypes: true });
  const logos = files
    .filter(entry => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map(entry => entry.name)
    .sort(naturalSort)
    .map(filename => encodePath(path.join(path.basename(logoDirectory), filename)));

  if (logos.length === 0) {
    throw new Error(`No supported logo images found in "${logoDirectory}".`);
  }

  return logos;
}

export async function generateLogoManifest({ logoDirectory, outputPath }) {
  const logos = await buildLogoManifest(logoDirectory);
  await writeFile(outputPath, `${JSON.stringify(logos, null, 2)}\n`, 'utf8');
  return logos;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const repositoryRoot = path.resolve(path.dirname(SCRIPT_PATH), '..');
  const logoDirectory = path.join(repositoryRoot, 'Gent Fossly logo');
  const outputPath = path.join(repositoryRoot, 'logos.json');

  try {
    const logos = await generateLogoManifest({ logoDirectory, outputPath });
    console.log(`Generated ${logos.length} logo(s) in ${path.relative(repositoryRoot, outputPath)}.`);
  } catch (error) {
    console.error(`Logo manifest generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
