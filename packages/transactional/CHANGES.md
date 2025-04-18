# Changelog

<!-- MONODEPLOY:BELOW -->

## [2.7.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.6.1...@nestjs-cls/transactional@2.7.0) "@nestjs-cls/transactional" (2025-04-18)<a name="2.7.0"></a>

### Dependencies

* update nestjs-related deps ([a10e589](https://github.com/Papooch/nestjs-cls/commits/a10e589))
* update testing deps ([d92a42d](https://github.com/Papooch/nestjs-cls/commits/d92a42d))
* update dev deps ([f22b578](https://github.com/Papooch/nestjs-cls/commits/f22b578))
* update dev deps ([58874d3](https://github.com/Papooch/nestjs-cls/commits/58874d3))

### Features

* **transactional**: introduce no-op adapter for testing ([0f9a374](https://github.com/Papooch/nestjs-cls/commits/0f9a374))




## [2.6.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.5.1...@nestjs-cls/transactional@2.6.0) "@nestjs-cls/transactional" (2025-03-25)<a name="2.6.0"></a>

### Features

* **transactional**: make Transactional decorator not depend on DI (#225) ([471ab7d](https://github.com/Papooch/nestjs-cls/commits/471ab7d))




## [2.5.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.4.12...@nestjs-cls/transactional@2.5.0) "@nestjs-cls/transactional" (2025-02-28)<a name="2.5.0"></a>

### Features

* **transactional**: adds supports propagation mode (#219) ([95b1fdb](https://github.com/Papooch/nestjs-cls/commits/95b1fdb))




## [2.4.10](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.4.9...@nestjs-cls/transactional@2.4.10) "@nestjs-cls/transactional" (2025-02-10)<a name="2.4.10"></a>

### Dependencies

* allow nestjs 10 as peer dependency ([b7057cb](https://github.com/Papooch/nestjs-cls/commits/b7057cb))




## [2.4.5](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.4.4...@nestjs-cls/transactional@2.4.5) "@nestjs-cls/transactional" (2025-01-21)<a name="2.4.5"></a>

### Dependencies

* update all nestjs-related peer deps to latest (v11) ([915e797](https://github.com/Papooch/nestjs-cls/commits/915e797))




## [2.4.4](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.4.3...@nestjs-cls/transactional@2.4.4) "@nestjs-cls/transactional" (2024-12-20)<a name="2.4.4"></a>

### Bug Fixes

* **transactional**: always inherit cls context ([45d7041](https://github.com/Papooch/nestjs-cls/commits/45d7041))
* **transactional**: do not reuse parent transaction context (#196) ([45d7041](https://github.com/Papooch/nestjs-cls/commits/45d7041))




## [2.4.2](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.4.1...@nestjs-cls/transactional@2.4.2) "@nestjs-cls/transactional" (2024-08-06)<a name="2.4.2"></a>

### Bug Fixes

* **transactional**: correct behavior of `Propagation.Never` ([cc63009](https://github.com/Papooch/nestjs-cls/commits/cc63009))
* **transactional**: correct behavior of `Propagation.Never` (#167) ([cc63009](https://github.com/Papooch/nestjs-cls/commits/cc63009))




## [2.4.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.3.1...@nestjs-cls/transactional@2.4.0) "@nestjs-cls/transactional" (2024-07-01)<a name="2.4.0"></a>

### Features

* **transactional**: enable using lifecycle hooks in TransactionalAdapter (#156) ([1ec49ea](https://github.com/Papooch/nestjs-cls/commits/1ec49ea))
* **transactional**: enable adapters to opt out of transactional proxy support (#160) ([9542cdb](https://github.com/Papooch/nestjs-cls/commits/9542cdb))




## [2.3.1](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.3.0...@nestjs-cls/transactional@2.3.1) "@nestjs-cls/transactional" (2024-05-22)<a name="2.3.1"></a>

### Bug Fixes

* **transactional**: preserve swagger metadata on methods decorated with @Transactional (#150) ([52b067e](https://github.com/Papooch/nestjs-cls/commits/52b067e))




## [2.3.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.2.2...@nestjs-cls/transactional@2.3.0) "@nestjs-cls/transactional" (2024-04-25)<a name="2.3.0"></a>

### Features

* **plugin-transactional**: add default options parameter to transactional adapter  (#145) ([8c2c150](https://github.com/Papooch/nestjs-cls/commits/8c2c150))




## [2.2.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.1.0...@nestjs-cls/transactional@2.2.0) "@nestjs-cls/transactional" (2024-02-21)<a name="2.2.0"></a>

### Features

* add option to inject tx directly as Proxy ([a522e85](https://github.com/Papooch/nestjs-cls/commits/a522e85))




## [2.1.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.0.3...@nestjs-cls/transactional@2.1.0) "@nestjs-cls/transactional" (2024-02-09)<a name="2.1.0"></a>

### Bug Fixes

* rework how plugins are registered (internals)

Previously all plugins' providers were mixed into one module,
now each plugin gets its own module. ([839df61](https://github.com/Papooch/nestjs-cls/commits/839df61))

### Features

* add multiple transactional adapters support

* Add tests for multiple named connections

* Add docs for multiple connections ([839df61](https://github.com/Papooch/nestjs-cls/commits/839df61))
* add support for multiple transactional adapters (#114) ([839df61](https://github.com/Papooch/nestjs-cls/commits/839df61))




## [2.0.1](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@2.0.0...@nestjs-cls/transactional@2.0.1) "@nestjs-cls/transactional" (2024-01-29)<a name="2.0.1"></a>



## [2.0.0](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@1.0.1...@nestjs-cls/transactional@2.0.0) "@nestjs-cls/transactional" (2024-01-25)<a name="2.0.0"></a>

### Breaking Changes

* The default mode is now REQUIRED which re-uses the transaction if one exists, while previously a new one was always started. ([8d693f2](https://github.com/Papooch/nestjs-cls/commits/8d693f2))

### Features

* add support for transaction propagation modes (#111) ([8d693f2](https://github.com/Papooch/nestjs-cls/commits/8d693f2))




## [1.0.1](https://github.com/Papooch/nestjs-cls/compare/@nestjs-cls/transactional@1.0.0...@nestjs-cls/transactional@1.0.1) "@nestjs-cls/transactional" (2024-01-22)<a name="1.0.1"></a>

### Bug Fixes

* update publish config ([da05ae7](https://github.com/Papooch/nestjs-cls/commits/da05ae7))


