# Changelog

<!-- MONOWEAVE:BELOW -->

## [2.0.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-typeorm@1.4.1...@nestjs-cls/transactional-adapter-typeorm@2.0.0) "@nestjs-cls/transactional-adapter-typeorm" (2026-09-20)<a name="2.0.0"></a>

### Breaking Changes

* The packages now define an `exports` map exposing only the
package root, and the build output moved from `dist/src` to `dist/cjs` and
`dist/esm`. Deep imports of internal files (e.g. `nestjs-cls/dist/src/...`)
are no longer possible. Additionally, an application that loads the same
package both via `import` and `require` gets two separate copies of it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com> ([cdfab2e](https://github.com/Papooch/nestjs-cls/commits/cdfab2e))

### Features

* ship an ESM build alongside the CommonJS one ([cdfab2e](https://github.com/Papooch/nestjs-cls/commits/cdfab2e))




## [1.4.1](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-typeorm@1.4.0...@nestjs-cls/transactional-adapter-typeorm@1.4.1) "@nestjs-cls/transactional-adapter-typeorm" (2026-09-20)<a name="1.4.1"></a>

### Dependencies

* Bump top-level deps to resolve dependabot PRs (#630) ([01bad9e](https://github.com/Papooch/nestjs-cls/commits/01bad9e))




## [1.4.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-typeorm@1.3.6...@nestjs-cls/transactional-adapter-typeorm@1.4.0) "@nestjs-cls/transactional-adapter-typeorm" (2026-09-04)<a name="1.4.0"></a>

### Features

* support NestJS 12 ([7c92d8e](https://github.com/Papooch/nestjs-cls/commits/7c92d8e))




## [1.3.4](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-typeorm@1.3.3...@nestjs-cls/transactional-adapter-typeorm@1.3.4) "@nestjs-cls/transactional-adapter-typeorm" (2026-05-25)<a name="1.3.4"></a>

### Bug Fixes

* **transactional-adapter-typeorm**: support TypeORM 1.0.0 (#576) ([a2db84a](https://github.com/Papooch/nestjs-cls/commits/a2db84a))




## [1.3.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-typeorm@1.2.24...@nestjs-cls/transactional-adapter-typeorm@1.3.0) "@nestjs-cls/transactional-adapter-typeorm" (2025-07-10)<a name="1.3.0"></a>

### Features

* **transactional**: support nested transaction propagation (#345) ([a8324ad](https://github.com/Papooch/nestjs-cls/commits/a8324ad))




## [1.2.23](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-typeorm@1.2.22...@nestjs-cls/transactional-adapter-typeorm@1.2.23) "@nestjs-cls/transactional-adapter-typeorm" (2025-06-06)<a name="1.2.23"></a>

### Bug Fixes

* **transactional-adapter-typeorm**: relax typeorm peerDependency version (#332) ([592354b](https://github.com/Papooch/nestjs-cls/commits/592354b))




## [1.2.19](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-typeorm@1.2.18...@nestjs-cls/transactional-adapter-typeorm@1.2.19) "@nestjs-cls/transactional-adapter-typeorm" (2025-04-18)<a name="1.2.19"></a>

### Dependencies

* update nestjs-related deps ([a10e589](https://github.com/Papooch/nestjs-cls/commits/a10e589))
* update database deps ([4cb30aa](https://github.com/Papooch/nestjs-cls/commits/4cb30aa))
* update testing deps ([d92a42d](https://github.com/Papooch/nestjs-cls/commits/d92a42d))
* update dev deps ([f22b578](https://github.com/Papooch/nestjs-cls/commits/f22b578))
* update dev deps ([58874d3](https://github.com/Papooch/nestjs-cls/commits/58874d3))




## [1.2.7](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-typeorm@1.2.6...@nestjs-cls/transactional-adapter-typeorm@1.2.7) "@nestjs-cls/transactional-adapter-typeorm" (2025-01-21)<a name="1.2.7"></a>

### Dependencies

* update all nestjs-related peer deps to latest (v11) ([915e797](https://github.com/Papooch/nestjs-cls/commits/915e797))




## [1.2.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-typeorm@1.1.0...@nestjs-cls/transactional-adapter-typeorm@1.2.0) "@nestjs-cls/transactional-adapter-typeorm" (2024-04-25)<a name="1.2.0"></a>

### Features

* **plugin-transactional**: add default options parameter to transactional adapter  (#145) ([8c2c150](https://github.com/Papooch/nestjs-cls/commits/8c2c150))




## [1.1.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-typeorm@1.0.0...@nestjs-cls/transactional-adapter-typeorm@1.1.0) "@nestjs-cls/transactional-adapter-typeorm" (2024-04-22)<a name="1.1.0"></a>

### Features

* **transactional-adapter-typeorm**: sparkles: add new transactional-adapter-typeorm ([a2a8e5a](https://github.com/Papooch/nestjs-cls/commits/a2a8e5a))
* add @nestjs-cls/transactional-adapter-typeorm (#141) ([a2a8e5a](https://github.com/Papooch/nestjs-cls/commits/a2a8e5a))


