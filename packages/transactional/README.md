# @nestjs-cls/transactional

A "Transactional" plugin for nestjs-cls that provides a generic interface that can be used to wrap any function call in a CLS-enabled transaction by storing the transaction reference in the CLS context.

The transaction reference can be then retrieved in any other service and refer to the same transaction without having to pass it around.

The plugin is designed to be database-agnostic and can be used with any database library that supports transactions (via adapters). At the expense of using a minimal wrapper, it deliberately does not require any monkey-patching of the underlying library.

### ➡️ [Go to the documentation website](https://papooch.github.io/nestjs-cls/plugins/available-plugins/transactional) 📖
