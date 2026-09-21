import {
    OWNED_BY_PARENT_ENV_VAR,
    stopTestDatabases,
} from './test-databases.mjs';

export default function globalTeardown(_globalConfig, projectConfig) {
    if (process.env[OWNED_BY_PARENT_ENV_VAR]) return;
    stopTestDatabases(projectConfig?.globals?.testDbServices ?? []);
}
