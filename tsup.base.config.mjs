/**
 * Shared tsup configuration for the nestjs-cls monorepo's publishable
 * packages (core, transactional, and the transactional adapters).
 *
 * Every source file under `src` (except specs) is compiled by tsup/esbuild
 * into its own output file, once as CommonJS and once as ESM, mirroring the
 * `src` directory structure 1:1 in `dist/cjs` and `dist/esm` respectively -
 * `bundle` is disabled on purpose so that deep imports keep working and
 * stack traces/source maps point at a specific, recognizable file rather
 * than an opaque bundle.
 *
 * CJS and ESM outputs live in separate directories (each with its own
 * `package.json` `type` field, copied in by the package's `build` script)
 * rather than side-by-side as `.js`/`.mjs`, because esbuild does not add
 * file extensions to relative import specifiers when `bundle` is disabled -
 * the source already spells out the extension itself (`./foo.js`, per the
 * TypeScript "nodenext" convention), and that only resolves correctly if
 * both formats keep the plain `.js` extension and are told apart by their
 * directory's `package.json` instead.
 *
 * Type declarations are generated separately by `tsc --emitDeclarationOnly`
 * (see each package's `build` script) using the same `tsconfig.build.json`,
 * which likewise preserves the per-file declaration structure.
 *
 * @param {import('tsup').Options} [overrides]
 * @returns {import('tsup').Options[]}
 */
export function createTsupConfig(overrides = {}) {
    const base = {
        entry: ['src/**/*.ts', '!src/**/*.spec.ts'],
        tsconfig: 'tsconfig.build.json',
        target: 'node18',
        platform: 'node',
        bundle: false,
        splitting: false,
        sourcemap: true,
        clean: true,
        dts: false,
    };
    return [
        {
            ...base,
            format: ['cjs'],
            outDir: 'dist/cjs',
            ...overrides,
        },
        {
            ...base,
            format: ['esm'],
            outDir: 'dist/esm',
            outExtension: () => ({ js: '.js' }),
            ...overrides,
        },
    ];
}
