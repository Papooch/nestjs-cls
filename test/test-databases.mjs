import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const composeFile = resolve(
    dirname(fileURLToPath(import.meta.url)),
    'docker-compose.yml',
);

/**
 * Set by `with-test-dbs.mjs` in the environment of the command it wraps. It
 * tells the Jest global setup and teardown that a parent process already
 * started the containers and will stop them once every suite has finished, so
 * an individual suite must not stop them itself.
 */
export const OWNED_BY_PARENT_ENV_VAR = 'NESTJS_CLS_TEST_DBS_OWNED';

export function listTestDatabaseServices() {
    return compose(['config', '--services'], { stdio: 'pipe' })
        .toString()
        .split('\n')
        .filter(Boolean);
}

export function startTestDatabases(services) {
    if (!services.length) return;
    compose(['up', '-d', '--quiet-pull', '--wait', ...services]);
}

export function stopTestDatabases(services) {
    if (!services.length) return;
    compose(['down', ...services]);
}

/**
 * Creates the databases a package's suites use, unless they already exist. The
 * shared Postgres container hands each spec file its own database, because Jest
 * runs the spec files of a package in parallel workers and they would otherwise
 * clobber each other's schema.
 */
export function ensurePostgresDatabases(databases) {
    for (const database of databases) {
        const exists = psql(
            `SELECT 1 FROM pg_database WHERE datname = '${database}'`,
            { stdio: 'pipe' },
        )
            .toString()
            .trim();
        if (exists) continue;
        psql(`CREATE DATABASE "${database}"`);
    }
}

function psql(statement, options = {}) {
    return compose(
        ['exec', '-T', 'postgres', 'psql', '-U', 'postgres', '-tAc', statement],
        options,
    );
}

function compose(args, options = {}) {
    return execFileSync('docker', ['compose', '-f', composeFile, ...args], {
        stdio: 'inherit',
        ...options,
    });
}
