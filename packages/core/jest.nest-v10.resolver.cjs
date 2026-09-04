/**
 * Jest resolver that keeps the aliased NestJS 10 packages self-consistent.
 *
 * `@nestjs/platform-express10` & co. are `npm:` aliases of the real v10
 * packages, and internally they `require('@nestjs/common')`. Because the
 * unaliased `@nestjs/common` in `node_modules` is v12 — which is ESM only —
 * that require blows up inside Jest's ESM runtime with
 * "Must use import to load ES Module".
 *
 * So whenever a module that lives inside a `@nestjs/<name>10` package asks for
 * another `@nestjs/<name>` package, hand it the `10` alias instead. That gives
 * the v10 adapters the v10 (CommonJS) runtime they were built against, and
 * with it real express 4 / fastify 4 instances to feature-detect against.
 */
const ALIASED_PACKAGE = /node_modules[\\/]@nestjs[\\/][^\\/]+10(?:[\\/]|$)/;

module.exports = (request, options) => {
    if (
        request.startsWith('@nestjs/') &&
        ALIASED_PACKAGE.test(options.basedir ?? '')
    ) {
        const [scope, name, ...rest] = request.split('/');
        try {
            return options.defaultResolver(
                [scope, `${name}10`, ...rest].join('/'),
                options,
            );
        } catch {
            // fall through to the unaliased package
        }
    }
    return options.defaultResolver(request, options);
};
