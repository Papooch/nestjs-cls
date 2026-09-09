/**
 * Shared tsup configuration for the nestjs-cls monorepo's publishable
 * packages (core, transactional, and the transactional adapters).
 *
 * Each package is built twice by tsup/esbuild - once as CommonJS
 * (`dist/index.js`) and once as ESM (`dist/index.mjs`) - so that consumers
 * get whichever format matches their own module system, without the package
 * authors having to hand-annotate relative import specifiers with explicit
 * extensions (which plain `tsc` requires for a working native ESM output).
 *
 * Type declarations are generated once (`dist/index.d.ts`) from the same
 * `tsconfig.build.json` already used for the package's existing CommonJS
 * build, and are shared by both the `require` and `import` conditions.
 *
 * @param {import('tsup').Options} [overrides]
 * @returns {import('tsup').Options}
 */
export function createTsupConfig(overrides = {}) {
    return {
        entry: ['src/index.ts'],
        format: ['cjs', 'esm'],
        tsconfig: 'tsconfig.build.json',
        target: 'node18',
        platform: 'node',
        splitting: false,
        sourcemap: true,
        clean: true,
        dts: true,
        ...overrides,
    };
}
