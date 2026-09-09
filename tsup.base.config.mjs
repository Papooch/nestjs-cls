/**
 * Shared tsup configuration for the nestjs-cls monorepo's publishable
 * packages (core, transactional, and the transactional adapters).
 *
 * Every source file under `src` (except specs) is compiled twice by
 * tsup/esbuild - once as CommonJS (`dist/**\/*.js`) and once as ESM
 * (`dist/**\/*.mjs`) - so that consumers get whichever format matches their
 * own module system, without the package authors having to hand-annotate
 * relative import specifiers with explicit extensions (which plain `tsc`
 * requires for a working native ESM output).
 *
 * `bundle` is disabled on purpose: the output mirrors the `src` directory
 * structure file-for-file instead of being packed into a single bundle, so
 * that deep imports keep working and stack traces/source maps point at a
 * specific, recognizable file rather than an opaque bundle.
 *
 * Type declarations are generated separately by `tsc --emitDeclarationOnly`
 * (see each package's `build` script) using the same `tsconfig.build.json`,
 * which likewise preserves the per-file declaration structure.
 *
 * @param {import('tsup').Options} [overrides]
 * @returns {import('tsup').Options}
 */
export function createTsupConfig(overrides = {}) {
    return {
        entry: ['src/**/*.ts', '!src/**/*.spec.ts'],
        format: ['cjs', 'esm'],
        tsconfig: 'tsconfig.build.json',
        target: 'node18',
        platform: 'node',
        bundle: false,
        splitting: false,
        sourcemap: true,
        clean: true,
        dts: false,
        ...overrides,
    };
}
