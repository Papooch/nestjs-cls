// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/vsLight');
const darkCodeTheme = require('prism-react-renderer/themes/vsDark');

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'NestJS CLS',
    tagline:
        "A continuation-local storage (async context) module compatible with NestJS's dependency injection.",
    favicon: 'img/favicon.ico',

    // Set the production url of your site here
    url: 'https://papooch.github.io',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: 'nestjs-cls',
    trailingSlash: false,

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'papooch', // Usually your GitHub org/user name.
    projectName: 'nestjs-cls', // Usually your repo name.
    deploymentBranch: 'gh-pages',

    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    routeBasePath: '/',
                    sidebarCollapsed: false,
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            // Replace with your project's social card
            navbar: {
                title: 'NestJS CLS',
                // logo: {
                //     alt: 'My Site Logo',
                //     src: 'img/logo.svg',
                // },
                items: [
                    {
                        type: 'docSidebar',
                        sidebarId: 'documentationSidebar',
                        position: 'left',
                        label: 'Documentation',
                    },
                    {
                        href: 'https://github.com/papooch/nestjs-cls',
                        label: 'GitHub',
                        position: 'right',
                    },
                ],
            },
            footer: {
                style: 'dark',
                links: [
                    {
                        title: 'Community',
                        items: [
                            {
                                label: 'NestJS Discord',
                                href: 'https://discord.gg/nestjs',
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} Ondřej Švanda (Papooch). Built with Docusaurus.`,
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
            },
            colorMode: {
                defaultMode: 'dark',
                respectPrefersColorScheme: true,
            },
        }),
};

module.exports = config;
