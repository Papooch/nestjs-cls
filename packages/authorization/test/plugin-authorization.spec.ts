import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule, ClsService, UseCls } from 'nestjs-cls';
import {
    ClsPluginAuthorization,
    PermissionDeniedException,
    RequirePermission,
} from '../src';

@Injectable()
class SecuredService {
    constructor() {}

    @UseCls()
    @RequirePermission((obj) => obj.role == 'ADMIN', {
        exceptionMessage: 'uh oh callback',
    })
    async securedByCallback() {
        return 'OK';
    }

    @UseCls()
    @RequirePermission('ADMIN', { exceptionMessage: 'uh oh value' })
    async securedByValue() {
        return 'OK';
    }
}

@Module({
    imports: [
        ClsModule.forRoot({
            plugins: [
                new ClsPluginAuthorization({
                    useFactory: () => ({
                        authObjectFactory: (cls) => ({ role: cls.get('role') }),
                        permissionResolutionStrategy: (
                            authObject,
                            value: string,
                        ) => authObject.role === value,
                        exceptionFactory: (options, value) => {
                            console.log(
                                'Creating exception with value:',
                                options,
                                value,
                            );
                            return new PermissionDeniedException(
                                (options.exceptionMessage ??
                                    'Permission denied') +
                                    (value ? ` (${value})` : ''),
                            );
                        },
                    }),
                }),
            ],
        }),
    ],
    providers: [SecuredService],
})
class AppModule {}

describe('Auth', () => {
    let module: TestingModule;
    let securedService: SecuredService;
    let cls: ClsService<{ role?: string }>;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        securedService = module.get(SecuredService);
        cls = module.get(ClsService);
    });

    describe('When callback check is used', () => {
        it('throws when check fails', async () => {
            await cls.runWith(
                {
                    ...cls.get(),
                    role: 'USER',
                },
                () =>
                    expect(() =>
                        securedService.securedByCallback(),
                    ).rejects.toThrow(
                        new PermissionDeniedException('uh oh callback'),
                    ),
            );
        });
        it('returns when check succeeds', async () => {
            await cls.runWith(
                {
                    ...cls.get(),
                    role: 'ADMIN',
                },
                () =>
                    expect(() =>
                        securedService.securedByCallback(),
                    ).resolves.toBe('OK'),
            );
        });
    });

    describe('When value check is used', () => {
        it('throws when check fails', async () => {
            await cls.runWith(
                {
                    ...cls.get(),
                    role: 'USER',
                },
                () =>
                    expect(() =>
                        securedService.securedByValue(),
                    ).rejects.toThrow(
                        new PermissionDeniedException('uh oh value (ADMIN)'),
                    ),
            );
        });
        it('returns when check succeeds', async () => {
            await cls.runWith(
                {
                    ...cls.get(),
                    role: 'ADMIN',
                },
                () =>
                    expect(() => securedService.securedByValue()).resolves.toBe(
                        'OK',
                    ),
            );
        });
    });
});
