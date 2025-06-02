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

## How too contribute

1. Fork the repository
2. Clone locally and install dependencies `yarn`
3. Create a branch for the feature
4. If you add new features, make sure to also add tests - you can run tests with `yarn test`
5. Make sure to update the documentation if it is related to the new feature
6. Run `yarn format` to format the codes.
7. If you're happy with your contribution, create a pull request from the branch against the upstream repo
8. Wait for the review from the maintainer and fix any issues raised
9. If you're contribution is accepted, it will be merged into the `main` branch and published to npm
