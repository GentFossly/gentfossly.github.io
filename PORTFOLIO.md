# Adding portfolio projects

The portfolio is built from the folders directly inside `images/`. GitHub Actions scans those folders, creates `projects.json`, and deploys the site with the generated file. You do not need to edit `portfolio.html` when adding projects.

## Controlling project order

Edit `project-order.json` in the repository root to list project folder names in the order they should appear on the portfolio page. Use the exact folder names inside `images/`, without the `images/` prefix. For example:

```json
[
  "03 - Open Up (Prototype)",
  "02 - Asiatic Lily (Prototype)",
  "Chromeliness II"
]
```

Listed projects appear first in that order. Any project folders not listed are appended in natural alphabetical order. Folder names remain the displayed project titles.

## Entering artwork dates

Edit `project-dates.json` in the repository root. Add the exact project folder name as a key and enter the creation month and year as text:

```json
{
  "Open Up (Prototype)": "January 2026",
  "Azulidad": "March 2025"
}
```

The text appears under that artwork's title on the portfolio card. Leave a project out of the file, or give it an empty string, to show no subtitle. After changing dates, run `node scripts/generate-projects.mjs` and refresh the local preview. The dates file is included automatically when the site is deployed.

## Folder and file rules

1. Create one folder directly under `images/` for each project. The folder name becomes the project title. For example: `images/Open Up/`.
2. Put all gallery media directly in that folder. Nested folders are not scanned.
3. Add exactly one image whose filename is `cover` plus an image extension, such as `cover.jpg`, `cover.jpeg`, `cover.png`, `cover.webp`, `cover.avif`, or `cover.gif`. Filename capitalization does not matter. The cover is shown on the portfolio page and is not repeated in the clicked-through gallery.
4. Add any other supported files next to the cover:
   - Images: `.avif`, `.bmp`, `.gif`, `.jpeg`, `.jpg`, `.png`, `.svg`, `.webp`
   - Videos: `.mp4`, `.ogv`, `.webm`
5. Use numbered filenames to control gallery order, for example `01-open.jpg`, `02-closed.jpg`, `03-detail.mp4`. Gallery files are ordered naturally by filename (`2` before `10`); the cover is excluded.
6. Avoid duplicate project folder names. Use filenames and folder names that work in URLs; spaces are supported.

Videos in the gallery start muted automatically when selected; playback controls remain available. Folders with no supported media are ignored. A folder with supported media but no cover, or more than one cover image, fails the build with a clear error instead of silently omitting the artwork.

The home page randomly features videos whose filename includes `showcase` (case-insensitive), such as `1-showcase.mp4` or `flower-showcase-detail.webm`. Other videos remain available in the portfolio gallery but are not selected for the home page.

## Previewing locally

After adding or renaming media, regenerate the local manifest and run the site through Live Server:

```bash
node scripts/generate-projects.mjs
```

Then open `portfolio.html` with Live Server and refresh the browser. The generator requires Node.js 20 or later. Do not open the page using a `file://` URL; the page loads `projects.json` with `fetch`, which needs a local web server.

You can run the manifest generator tests with:

```bash
node --test scripts/generate-projects.test.mjs
```

## Publishing

Commit and push the new project folder to the `main` branch. The GitHub Actions workflow tests the generator, rebuilds `projects.json`, and deploys the site. Check the repository's **Actions** tab; the **Build and deploy portfolio** run should complete successfully. A failed build reports issues such as a missing cover. Fix the folder, commit, and push again.

The committed `projects.json` is a useful local preview snapshot. GitHub Actions regenerates it on every deployment, so the deployed portfolio reflects the folders in that push even if the checked-in snapshot was not refreshed manually.
