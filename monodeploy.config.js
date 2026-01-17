module.exports = {
    preset: 'monodeploy/preset-recommended',
    changesetIgnorePatterns: ['**/test/**'],
    conventionalChangelogConfig: '@tophat/conventional-changelog-config',
    changelogFilename: '<packageDir>/CHANGES.md',
    git: {
        push: true,
    },
    registryUrl: 'https://registry.npmjs.org',
    plugins: ['@monodeploy/plugin-github'],
};
