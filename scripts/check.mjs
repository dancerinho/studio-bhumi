import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Script } from 'node:vm';
import { build, root } from './build.mjs';
try {
  await build();
  for (const file of await readdir(join(root, 'src/assets'))) {
    if (file.endsWith('.js')) new Script(await readFile(join(root, 'src/assets', file), 'utf8'), { filename: file });
  }
  console.log('Contenuti e sintassi di tutti gli script del sito: OK');
} catch (error) {
  console.error(`Controllo fallito — ${error.message}`);
  process.exitCode = 1;
}
