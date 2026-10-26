import { Test } from '@nestjs/testing';
import { ClsModule } from '../../src';
import { ClsPluginsHooksHost } from '../../src/lib/plugin/cls-plugin-hooks-host';

async function bootApp() {
    const module = await Test.createTestingModule({
        imports: [ClsModule.forRoot({ middleware: { mount: true } })],
    }).compile();
    const app = module.createNestApplication();
    await app.init();
    return app;
}

describe('ClsPluginsHooksHost', () => {
    it('releases the instance when the app is closed', async () => {
        const app = await bootApp();
        expect(() => ClsPluginsHooksHost.getInstance()).not.toThrow();

        await app.close();

        expect(() => ClsPluginsHooksHost.getInstance()).toThrow(
            'ClsPluginsHooksHost not initialized',
        );
    });

    it('keeps the instance of a newer app when an older app is closed', async () => {
        const older = await bootApp();
        const newer = await bootApp();
        const newerInstance = ClsPluginsHooksHost.getInstance();

        await older.close();

        expect(ClsPluginsHooksHost.getInstance()).toBe(newerInstance);
        await newer.close();
    });
});
