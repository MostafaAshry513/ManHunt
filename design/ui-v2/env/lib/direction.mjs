// Direction folder layout resolution.
//
// A direction may keep its 14 page files either directly in
//   design/ui-v2/directions/<direction>/<page>.html
// (designer-a's layout) or in a pages/ subfolder
//   design/ui-v2/directions/<direction>/pages/<page>.html
// (designer-b / designer-c layout, also what the task spec asks for).
//
// In both layouts the rendered PNGs belong in <direction>/out/.
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { sortPages, pageId, pageTitle } from './canonical.mjs';

const htmlFiles = (entries) =>
  entries
    .filter((e) => e.isFile() && /\.html?$/i.test(e.name) && !e.name.startsWith('_'))
    .map((e) => e.name);

/**
 * Resolve the page folder for a direction.
 * Prefers <dir>/pages/ when it contains HTML, else the direction root.
 * @returns {Promise<{pagesDir: string, outDir: string, directionDir: string, pageFiles: string[]}>}
 */
export async function resolveDirectionLayout(dir) {
  const directionDir = path.resolve(dir);
  const pagesDir = path.join(directionDir, 'pages');
  if (existsSync(pagesDir)) {
    const entries = await readdir(pagesDir, { withFileTypes: true }).catch(() => []);
    const files = htmlFiles(entries);
    if (files.length) return { pagesDir, outDir: path.join(directionDir, 'out'), directionDir, pageFiles: sortPages(files) };
  }
  const entries = await readdir(directionDir, { withFileTypes: true }).catch(() => []);
  const files = htmlFiles(entries);
  return { pagesDir: directionDir, outDir: path.join(directionDir, 'out'), directionDir, pageFiles: sortPages(files) };
}

/** Canonical page records for a direction, in canonical order. */
export async function readDirectionPages(dir) {
  const layout = await resolveDirectionLayout(dir);
  return {
    ...layout,
    pages: layout.pageFiles.map((f) => ({ id: pageId(f), title: pageTitle(f), file: path.join(layout.pagesDir, f) })),
  };
}
