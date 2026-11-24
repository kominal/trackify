// Bundles the main process and the preload script. Dependencies stay external (electron-builder
// ships them from node_modules; get-windows carries a native addon).
import { build } from 'esbuild';

const common = { bundle: true, platform: 'node', target: 'node22', format: 'cjs', sourcemap: true, logLevel: 'info' };

await build({ ...common, entryPoints: ['src/main.ts'], outfile: 'dist/main.js', packages: 'external' });
// Sandboxed preload scripts may only require 'electron': everything else is bundled in.
await build({ ...common, entryPoints: ['src/preload.ts'], outfile: 'dist/preload.js', external: ['electron'] });
