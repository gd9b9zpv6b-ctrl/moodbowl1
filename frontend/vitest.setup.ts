import Module from 'node:module';

const ASSET_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'] as const;

for (const ext of ASSET_EXTS) {
  // Node cannot parse image binaries · stub for unit tests that import emotions.ts.
  (Module as typeof Module & {
    _extensions: Record<string, (module: NodeModule, filename: string) => void>;
  })._extensions[ext] = (module) => {
    module.exports = 1;
  };
}
