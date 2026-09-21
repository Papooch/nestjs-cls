# Contributing to `nestjs-cls`

The contribution guide is a work in progress, your firs contribution can be updating the contribution guide :)

If you have an idea on how to improve the lib, feel free to create an issue. If you see an open issue that you'd like to tackle, read below.

## Development

This repository is managed by `yarn` workspaces. To get started, clone the repo and run `yarn install` in the root directory.

There are multiple workspaces in this repository:

| Package Name                                | Filepath                                    | Description                       |
| ------------------------------------------- | ------------------------------------------- | --------------------------------- |
| nestjs-cls                                  | `packages/core`                             | the core package                  |
| @nestjs-cls/transactional                   | `packages/transactional`                    | the transactional plugin          |
| @nestjs-cls/transactional-adapter-<adapter> | `packages/transactional-adapters/<adapter>` | the transactional plugin adapters |
| nestjs-cls-docs                             | `docs`                                      | the documentation website         |

To run a `yarn` command in a specific workspace, use the syntax:

```bash
yarn workspace <package-name> <command>
```

> Example:  
> To install the `sqlite3` library as a dev dependency for your "prisma" adapter package, run:
>
> ```bash
> yarn workspace @nestjs-cls/transactional-adapter-prisma add -D sqlite3
> ```

Alternatively, you can `cd` into the package's directory and run `yarn <command>`.

If you make a change in a package that other packages depend on, you need to run `yarn build` in the root directory (or in the changed package's directory) to build the packages before you can test your changes.

`yarn build` only emits the CommonJS build (along with the type declarations), which is all that is needed during development. The published packages also contain an ESM build. To build both, run `yarn build:release`, and then `yarn workspace nestjs-cls run test:dual-build` to verify that both builds work.

## Running tests

Run `yarn test` in the root directory to run every suite, or `yarn workspace <package-name> test` to run just one.

The adapter suites for Postgres and Mongo run against shared containers defined in `test/docker-compose.yml`, so Docker has to be available. You don't need to start them yourself — a Jest global setup brings up the services a package declares in its `jest.config.mjs` and stops them again afterwards:

```js
export default createJestConfig(import.meta.url, {
    services: ['postgres'],
    postgresDatabases: ['kysely'],
});
```

Each spec file that talks to Postgres gets a database of its own, because Jest runs the spec files of a package in parallel workers. The databases are created on demand by the global setup; Mongo creates its own on first write.

A root `yarn test` runs the workspaces in parallel and wraps the whole run in `test/with-test-dbs.mjs`, which starts the containers once up front and stops them after the last suite, so suites that overlap don't pull the databases out from under each other. Suites that need no database (the core package, `knex`, and the synchronous `drizzle-orm` suite, which use SQLite) never touch Docker at all.

If a run is interrupted and leaves containers behind, `yarn test:db:down` removes them. `yarn test:db:up` starts them by hand.

## How too contribute

1. Fork the repository
2. Clone locally and install dependencies `yarn`
3. Create a branch for the feature
4. If you add new features, make sure to also add tests - you can run tests with `yarn test`
5. Make sure to update the documentation if it is related to the new feature
6. Run `yarn format` to ensure a consistent formatting.
7. If you're happy with your contribution, create a pull request from the branch against the upstream repo
8. Wait for the review from the maintainer and fix any issues raised
9. If you're contribution is accepted, it will be merged into the `main` branch and published to npm
