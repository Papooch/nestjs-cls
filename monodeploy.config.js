module.exports = {
    preset: 'monodeploy/preset-recommended',
    changesetIgnorePatterns: ['**/test/**'],
    conventionalChangelogConfig: '@tophat/conventional-changelog-config',
    changelogFilename: '<packageDir>/CHANGELOG.md',
    git: {
        push: true,
    },
};
