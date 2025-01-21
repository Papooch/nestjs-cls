# Changelog

<!-- MONODEPLOY:BELOW -->

## [5.0.0](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.5.0...nestjs-cls@5.0.0) "nestjs-cls" (2025-01-21)<a name="5.0.0"></a>

### Breaking Changes

* The default mount point for express middleware has been changed from '*' to '/' ([4542aba](https://github.com/Papooch/nestjs-cls/commits/4542aba))

### Dependencies

* update all nestjs-related peer deps to latest (v11) ([915e797](https://github.com/Papooch/nestjs-cls/commits/915e797))

### Features

* **core**: support NestJS 11 ([4542aba](https://github.com/Papooch/nestjs-cls/commits/4542aba))




## [4.5.0](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.4.1...nestjs-cls@4.5.0) "nestjs-cls" (2024-12-07)<a name="4.5.0"></a>

### Features

* **core**: adds ClsModule.registerPlugins to inject Plugins from an external module (#192) ([11c40a0](https://github.com/Papooch/nestjs-cls/commits/11c40a0))




## [4.4.1](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.4.0...nestjs-cls@4.4.1) "nestjs-cls" (2024-08-06)<a name="4.4.1"></a>

### Bug Fixes

* **core**: support primitive values in websocket payload ([7f5c068](https://github.com/Papooch/nestjs-cls/commits/7f5c068))
* **core**: support primitive values in websocket payload (#172) ([7f5c068](https://github.com/Papooch/nestjs-cls/commits/7f5c068))




## [4.4.0](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.3.0...nestjs-cls@4.4.0) "nestjs-cls" (2024-07-26)<a name="4.4.0"></a>

### Features

* add `strict` option to proxy providers ([3f3de78](https://github.com/Papooch/nestjs-cls/commits/3f3de78))
* enable setting proxy provider `strict` option via a decorator. ([3f3de78](https://github.com/Papooch/nestjs-cls/commits/3f3de78))
* enable `strict` mode for Proxy Providers (#171) ([3f3de78](https://github.com/Papooch/nestjs-cls/commits/3f3de78))




## [4.3.0](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.2.1...nestjs-cls@4.3.0) "nestjs-cls" (2024-03-22)<a name="4.3.0"></a>

### Features

* add option to selectively resolve proxy providers ([26baa42](https://github.com/Papooch/nestjs-cls/commits/26baa42))
* selectively resolve proxy providers (#131) ([26baa42](https://github.com/Papooch/nestjs-cls/commits/26baa42))




## [4.2.1](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.2.0...nestjs-cls@4.2.1) "nestjs-cls" (2024-03-14)<a name="4.2.1"></a>

### Bug Fixes

* prevent context from leaking with ClsGuard (#129) ([7026fdf](https://github.com/Papooch/nestjs-cls/commits/7026fdf))




## [4.2.0](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.1.0...nestjs-cls@4.2.0) "nestjs-cls" (2024-02-21)<a name="4.2.0"></a>

### Bug Fixes

* make proxy providers compatible with #private fields ([367dfc7](https://github.com/Papooch/nestjs-cls/commits/367dfc7))

### Features

* add imperative API to get/set Proxy providers (#123) ([fbb27dc](https://github.com/Papooch/nestjs-cls/commits/fbb27dc))




## [4.1.0](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.0.4...nestjs-cls@4.1.0) "nestjs-cls" (2024-02-09)<a name="4.1.0"></a>

### Bug Fixes

* rework how plugins are registered (internals)

Previously all plugins' providers were mixed into one module,
now each plugin gets its own module. ([839df61](https://github.com/Papooch/nestjs-cls/commits/839df61))

### Features

* add multiple transactional adapters support

* Add tests for multiple named connections

* Add docs for multiple connections ([839df61](https://github.com/Papooch/nestjs-cls/commits/839df61))
* add support for multiple transactional adapters (#114) ([839df61](https://github.com/Papooch/nestjs-cls/commits/839df61))




## [4.0.4](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.0.3...nestjs-cls@4.0.4) "nestjs-cls" (2024-02-03)<a name="4.0.4"></a>

### Bug Fixes

* **core**: handle nested context correctly with UseCls decorator (#119) ([df90f30](https://github.com/Papooch/nestjs-cls/commits/df90f30))




## [4.0.3](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.0.2...nestjs-cls@4.0.3) "nestjs-cls" (2024-01-31)<a name="4.0.3"></a>

### Bug Fixes

* **proxy-provider-manager**: handle setting falsy value

Co-authored-by: Jerry Laloan <jerrylaloan@users.noreply.github.com> ([26737d8](https://github.com/Papooch/nestjs-cls/commits/26737d8))
* **core**: handle setting falsy value in proxy providers (#118) ([26737d8](https://github.com/Papooch/nestjs-cls/commits/26737d8))




## [4.0.2](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.0.1...nestjs-cls@4.0.2) "nestjs-cls" (2024-01-29)<a name="4.0.2"></a>

### Bug Fixes

* symbol key access and explicit constructor error (#113) ([0d4e97b](https://github.com/Papooch/nestjs-cls/commits/0d4e97b))




## [4.0.1](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@4.0.0...nestjs-cls@4.0.1) "nestjs-cls" (2024-01-22)<a name="4.0.1"></a>

### Bug Fixes

* update publish config ([da05ae7](https://github.com/Papooch/nestjs-cls/commits/da05ae7))




## [3.6.0](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@3.5.1...nestjs-cls@3.6.0) "nestjs-cls" (2023-10-18)<a name="3.6.0"></a>

### Features

* allow registering Proxy providers globally ([92d00f7](https://github.com/Papooch/nestjs-cls/commits/92d00f7))




## [3.5.1](https://github.com/Papooch/nestjs-cls/compare/nestjs-cls@3.5.0...nestjs-cls@3.5.1) "nestjs-cls" (2023-08-29)<a name="3.5.1"></a>

### Bug Fixes

* add rxjs and reflect-metadata as peer deps (#86) ([566f85a](https://github.com/Papooch/nestjs-cls/commits/566f85a))




## [3.5.0](https://github.com/Papooch/nestjs-cls/compare/v3.4.0...v3.5.0) "nestjs-cls" (2023-08-11)<a name="3.4.0"></a>

-   This is where we start the changelog with `monodeploy`. To view older changes, see Releases on GitHub or the commit history.
