import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGE_EXTENSIONS = new Set(['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.ogv', '.webm']);
const SCRIPT_PATH = fileURLToPath(import.meta.url);

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }) || a.localeCompare(b);
}

function displayName(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function encodePath(relativePath) {
  return relativePath.split(path.sep).map(encodeURIComponent).join('/');
}

export async function buildProjects(imagesDirectory) {
  const entries = await readdir(imagesDirectory, { withFileTypes: true });
  const projectDirectories = entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
    .sort(naturalSort);
  const projects = [];

  for (const directoryName of projectDirectories) {
    const projectDirectory = path.join(imagesDirectory, directoryName);
    const files = await readdir(projectDirectory, { withFileTypes: true });
    const mediaFiles = files
      .filter(entry => entry.isFile())
      .map(entry => entry.name)
      .filter(filename => {
        const extension = path.extname(filename).toLowerCase();
        return IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension);
      });

    if (mediaFiles.length === 0) {
      continue;
    }

    const covers = mediaFiles.filter(filename =>
      path.basename(filename, path.extname(filename)).toLowerCase() === 'cover' &&
      IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase())
    );

    if (covers.length !== 1) {
      throw new Error(
        `Project "${directoryName}" must contain exactly one cover image named cover.<extension>; found ${covers.length}.`
      );
    }

    const cover = covers[0];
    const orderedMedia = [cover, ...mediaFiles.filter(filename => filename !== cover).sort(naturalSort)];
    const media = orderedMedia.map(filename => {
      const extension = path.extname(filename).toLowerCase();
      const type = IMAGE_EXTENSIONS.has(extension) ? 'image' : 'video';
      const relativePath = path.join('images', directoryName, filename);
      const item = { type, src: encodePath(relativePath) };

      if (type === 'image') {
        item.alt = `${directoryName} — ${displayName(filename) || 'artwork'}`;
      }

      return item;
    });

    projects.push({
      title: directoryName,
      subtitle: 'Artwork study',
      cover: media[0].src,
      media
    });
  }

  return projects;
}

export async function generateProjects({ imagesDirectory, outputPath }) {
  const projects = await buildProjects(imagesDirectory);
  await writeFile(outputPath, `${JSON.stringify(projects, null, 2)}\n`, 'utf8');
  return projects;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const repositoryRoot = path.resolve(path.dirname(SCRIPT_PATH), '..');
  const imagesDirectory = path.join(repositoryRoot, 'images');
  const outputPath = path.join(repositoryRoot, 'projects.json');

  try {
    const projects = await generateProjects({ imagesDirectory, outputPath });
    console.log(`Generated ${projects.length} project(s) in ${path.relative(repositoryRoot, outputPath)}.`);
  } catch (error) {
    console.error(`Portfolio manifest generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
