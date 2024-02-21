# Changelog

<!-- MONODEPLOY:BELOW -->

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


