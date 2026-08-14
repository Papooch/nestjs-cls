# Changelog

<!-- MONOWEAVE:BELOW -->

## [1.4.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-drizzle-orm@1.3.0...@nestjs-cls/transactional-adapter-drizzle-orm@1.4.0) "@nestjs-cls/transactional-adapter-drizzle-orm" (2026-08-14)<a name="1.4.0"></a>

### Features

* **transactional-adapter-drizzle-orm**: accept drizzle-orm v1 in the peer range (#604) ([5417f21](https://github.com/Papooch/nestjs-cls/commits/5417f21))




## [1.3.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-drizzle-orm@1.2.4...@nestjs-cls/transactional-adapter-drizzle-orm@1.3.0) "@nestjs-cls/transactional-adapter-drizzle-orm" (2026-06-10)<a name="1.3.0"></a>

### Features

* **transactional-adapter-drizzle-orm**: support better-sqlite3 via transactionMode option

Adds an opt-in `transactionMode?: 'async' | 'sync'` option to the
adapter constructor. Defaults to `'async'` (no behavior change for
existing libsql/node-postgres/postgres-js/mysql2 users). In `'sync'`
mode the inner transaction callback runs synchronously and the result
is wrapped in `Promise.resolve(...)` to satisfy the plugin's
`wrapWithTransaction: Promise<T>` contract — required by
`better-sqlite3`, which rejects async callbacks. ([9956a92](https://github.com/Papooch/nestjs-cls/commits/9956a92))
* **transactional-adapter-drizzle-orm**: support better-sqlite3 via transactionMode option (#572) ([9956a92](https://github.com/Papooch/nestjs-cls/commits/9956a92))




## [1.2.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-drizzle-orm@1.1.20...@nestjs-cls/transactional-adapter-drizzle-orm@1.2.0) "@nestjs-cls/transactional-adapter-drizzle-orm" (2025-07-10)<a name="1.2.0"></a>

### Features

* **transactional**: support nested transaction propagation (#345) ([ef4df9d](https://github.com/Papooch/nestjs-cls/commits/ef4df9d))
* **transactional-adapter-drizzle-orm**: add nested transaction support (#363) ([ef4df9d](https://github.com/Papooch/nestjs-cls/commits/ef4df9d))




## [1.1.16](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-drizzle-orm@1.1.15...@nestjs-cls/transactional-adapter-drizzle-orm@1.1.16) "@nestjs-cls/transactional-adapter-drizzle-orm" (2025-04-18)<a name="1.1.16"></a>

### Dependencies

* update nestjs-related deps ([a10e589](https://github.com/Papooch/nestjs-cls/commits/a10e589))
* update database deps ([4cb30aa](https://github.com/Papooch/nestjs-cls/commits/4cb30aa))
* update testing deps ([d92a42d](https://github.com/Papooch/nestjs-cls/commits/d92a42d))
* update dev deps ([f22b578](https://github.com/Papooch/nestjs-cls/commits/f22b578))
* update dev deps ([58874d3](https://github.com/Papooch/nestjs-cls/commits/58874d3))




## [1.1.4](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-drizzle-orm@1.1.3...@nestjs-cls/transactional-adapter-drizzle-orm@1.1.4) "@nestjs-cls/transactional-adapter-drizzle-orm" (2025-01-21)<a name="1.1.4"></a>

### Dependencies

* update all nestjs-related peer deps to latest (v11) ([915e797](https://github.com/Papooch/nestjs-cls/commits/915e797))




## [1.1.1](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-drizzle-orm@1.1.0...@nestjs-cls/transactional-adapter-drizzle-orm@1.1.1) "@nestjs-cls/transactional-adapter-drizzle-orm" (2024-10-27)<a name="1.1.1"></a>

### Bug Fixes

* update drizzle adapter readme with correct link ([1d684c6](https://github.com/Papooch/nestjs-cls/commits/1d684c6))




## [1.1.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional-adapter-drizzle-orm@1.0.0...@nestjs-cls/transactional-adapter-drizzle-orm@1.1.0) "@nestjs-cls/transactional-adapter-drizzle-orm" (2024-10-27)<a name="1.1.0"></a>

### Features

* **drizzle**: add basic support for drizzle-orm postgres (#179) ([d00f5d6](https://github.com/Papooch/nestjs-cls/commits/d00f5d6))
* **drizzle**: add basic support for drizzle-orm postgres ([d00f5d6](https://github.com/Papooch/nestjs-cls/commits/d00f5d6))
* **drizzle**: update drizzle-orm package.json description ([d00f5d6](https://github.com/Papooch/nestjs-cls/commits/d00f5d6))
* **drizzle**: update drizzle-orm package.json description ([d00f5d6](https://github.com/Papooch/nestjs-cls/commits/d00f5d6))
* **drizzle**: remove copied changes ([d00f5d6](https://github.com/Papooch/nestjs-cls/commits/d00f5d6))
* **transactional-adapter-drizzle-orm**: make drizzle orm adapter universal ([d00f5d6](https://github.com/Papooch/nestjs-cls/commits/d00f5d6))
* **transactional-adapter-drizzle-orm**: add drizzle orm adapter (#180) ([d00f5d6](https://github.com/Papooch/nestjs-cls/commits/d00f5d6))


