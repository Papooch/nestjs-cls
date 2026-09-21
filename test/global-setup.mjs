import {
    ensurePostgresDatabases,
    OWNED_BY_PARENT_ENV_VAR,
    startTestDatabases,
} from './test-databases.mjs';

export default function globalSetup(_globalConfig, projectConfig) {
    const { testDbServices = [], testPostgresDatabases = [] } =
        projectConfig?.globals ?? {};
    if (!process.env[OWNED_BY_PARENT_ENV_VAR]) {
        startTestDatabases(testDbServices);
    }
    ensurePostgresDatabases(testPostgresDatabases);
}
