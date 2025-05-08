import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule, UseCls } from 'nestjs-cls';
import {
    ClsPluginAuth,
    PermissionDeniedException,
    RequirePermission,
} from '../src';

@Injectable()
class SecuredService {
    constructor() {}

    @UseCls()
    @RequirePermission((obj) => obj.allow, { exceptionMessage: 'uh oh' })
    async securedMethod() {
        return 'OK';
    }
}

@Module({
    imports: [
        ClsModule.forRoot({
            plugins: [
                new ClsPluginAuth({
                    useFactory: () => ({
                        authObjectFactory: () => ({ allow: false }),
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

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        securedService = module.get(SecuredService);
    });

    it('should throw', async () => {
        await expect(() => securedService.securedMethod()).rejects.toThrow(
            new PermissionDeniedException('uh oh'),
        );
    });
});
