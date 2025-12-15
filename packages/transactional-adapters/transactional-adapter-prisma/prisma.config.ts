import { defineConfig } from 'prisma/config';

export default defineConfig({
    datasource: {
        url: process.env.DATA_SOURCE_URL ?? '',
    },
});
