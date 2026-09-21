import { createJestConfig } from '../../../jest.base.config.mjs';

export default createJestConfig(import.meta.url, {
    services: ['postgres'],
    postgresDatabases: ['pg_promise'],
});
