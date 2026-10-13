import { build } from './build.mjs';
try {
  await build();
  await import('../serve.mjs');
} catch (error) {
  console.error(`Avvio annullato — ${error.message}`);
  process.exitCode = 1;
}
