#!/usr/bin/env node
/**
 * Starts the shared test databases, runs the command passed as arguments and
 * stops them again once it exits. Suites started by that command see
 * `OWNED_BY_PARENT_ENV_VAR` and leave the containers alone, which keeps them up
 * for the whole run even when one suite finishes while another is still going.
 */
import { spawn } from 'node:child_process';
import {
    listTestDatabaseServices,
    OWNED_BY_PARENT_ENV_VAR,
    startTestDatabases,
    stopTestDatabases,
} from './test-databases.mjs';

const [command, ...args] = process.argv.slice(2);

if (!command) {
    console.error('Usage: node test/with-test-dbs.mjs <command> [...args]');
    process.exit(1);
}

const services = listTestDatabaseServices();
startTestDatabases(services);

let stopped = false;
const stop = () => {
    if (stopped) return;
    stopped = true;
    stopTestDatabases(services);
};

const child = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, [OWNED_BY_PARENT_ENV_VAR]: '1' },
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill(signal));
}

child.on('error', (error) => {
    console.error(error);
    stop();
    process.exit(1);
});

child.on('exit', (code, signal) => {
    stop();
    process.exit(signal ? 1 : (code ?? 1));
});
