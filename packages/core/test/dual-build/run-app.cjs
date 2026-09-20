// Boots a minimal Nest application against the given module namespaces
// (loaded by the caller either via `require` or `import`) and returns the
// value read back from the CLS store through an injected ClsService.
module.exports = async function runApp({ common, core, cls }) {
    const { Injectable, Module } = common;
    const { NestFactory } = core;
    const { ClsModule, ClsService } = cls;

    class Consumer {
        constructor(cls) {
            this.cls = cls;
        }
    }
    Reflect.defineMetadata('design:paramtypes', [ClsService], Consumer);
    Injectable()(Consumer);

    class AppModule {}
    Module({
        imports: [ClsModule.forRoot({ global: true })],
        providers: [Consumer],
    })(AppModule);

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: false,
    });
    try {
        const { cls: clsService } = app.get(Consumer);
        return await clsService.run(async () => {
            clsService.set('key', 'value');
            return clsService.get('key');
        });
    } finally {
        await app.close();
    }
};
