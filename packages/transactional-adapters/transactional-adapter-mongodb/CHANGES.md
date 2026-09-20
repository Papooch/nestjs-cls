# Changelog

<!-- MONOWEAVE:BELOW -->

## [2.0.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-mongodb@1.2.1...@nestjs-cls/transactional-adapter-mongodb@2.0.0) "@nestjs-cls/transactional-adapter-mongodb" (2026-09-20)<a name="2.0.0"></a>

### Breaking Changes

* The packages now define an `exports` map exposing only the
package root, and the build output moved from `dist/src` to `dist/cjs` and
`dist/esm`. Deep imports of internal files (e.g. `nestjs-cls/dist/src/...`)
are no longer possible. Additionally, an application that loads the same
package both via `import` and `require` gets two separate copies of it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com> ([cdfab2e](https://github.com/Papooch/nestjs-cls/commits/cdfab2e))

### Features

* ship an ESM build alongside the CommonJS one ([cdfab2e](https://github.com/Papooch/nestjs-cls/commits/cdfab2e))




## [1.2.1](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-mongodb@1.2.0...@nestjs-cls/transactional-adapter-mongodb@1.2.1) "@nestjs-cls/transactional-adapter-mongodb" (2026-09-20)<a name="1.2.1"></a>

### Dependencies

* Bump top-level deps to resolve dependabot PRs (#630) ([01bad9e](https://github.com/Papooch/nestjs-cls/commits/01bad9e))




## [1.2.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-mongodb@1.1.29...@nestjs-cls/transactional-adapter-mongodb@1.2.0) "@nestjs-cls/transactional-adapter-mongodb" (2026-09-04)<a name="1.2.0"></a>

### Features

* support NestJS 12 ([7c92d8e](https://github.com/Papooch/nestjs-cls/commits/7c92d8e))




## [1.1.19](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-mongodb@1.1.18...@nestjs-cls/transactional-adapter-mongodb@1.1.19) "@nestjs-cls/transactional-adapter-mongodb" (2025-04-18)<a name="1.1.19"></a>

### Dependencies

* update nestjs-related deps ([a10e589](https://github.com/Papooch/nestjs-cls/commits/a10e589))
* update database deps ([4cb30aa](https://github.com/Papooch/nestjs-cls/commits/4cb30aa))
* update testing deps ([d92a42d](https://github.com/Papooch/nestjs-cls/commits/d92a42d))
* update dev deps ([f22b578](https://github.com/Papooch/nestjs-cls/commits/f22b578))
* update dev deps ([58874d3](https://github.com/Papooch/nestjs-cls/commits/58874d3))




## [1.1.7](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-mongodb@1.1.6...@nestjs-cls/transactional-adapter-mongodb@1.1.7) "@nestjs-cls/transactional-adapter-mongodb" (2025-01-21)<a name="1.1.7"></a>

### Dependencies

* update all nestjs-related peer deps to latest (v11) ([915e797](https://github.com/Papooch/nestjs-cls/commits/915e797))




## [1.1.4](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-mongodb@1.1.3...@nestjs-cls/transactional-adapter-mongodb@1.1.4) "@nestjs-cls/transactional-adapter-mongodb" (2024-12-06)<a name="1.1.4"></a>

### Bug Fixes

* **transactional-adapter-mongodb**: fix mongodb peer dependency version (#190) ([5459c7a](https://github.com/Papooch/nestjs-cls/commits/5459c7a))




## [1.1.1](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-mongodb@1.1.0...@nestjs-cls/transactional-adapter-mongodb@1.1.1) "@nestjs-cls/transactional-adapter-mongodb" (2024-07-02)<a name="1.1.1"></a>



## [1.1.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-mongodb@1.0.0...@nestjs-cls/transactional-adapter-mongodb@1.1.0) "@nestjs-cls/transactional-adapter-mongodb" (2024-07-01)<a name="1.1.0"></a>

### Features

* **transactional-adapter-mongodb**: add `mongodb` adapter (#158) ([90f2df4](https://github.com/Papooch/nestjs-cls/commits/90f2df4))
* **transactional-adapter-mongodb**: add `mongodb` adapter (#161) ([90f2df4](https://github.com/Papooch/nestjs-cls/commits/90f2df4))


