import { Module, ValueProvider } from '@nestjs/common';
import { ClsServiceManager } from '../cls-service-manager';
import { CLS_CTX, CLS_REQ, CLS_RES } from '../cls.constants';
import { ClsService } from '../cls.service';

import { ProxyProviderManager } from '../proxy-provider/proxy-provider-manager';

const clsServiceProvider: ValueProvider<ClsService> = {
    provide: ClsService,
    useValue: ClsServiceManager.getClsService(),
};

const commonProviders = [
    clsServiceProvider,
    ProxyProviderManager.createProxyProviderFromExistingKey(CLS_REQ, {
        strict: true,
    }),
    ProxyProviderManager.createProxyProviderFromExistingKey(CLS_RES, {
        strict: true,
    }),
    ProxyProviderManager.createProxyProviderFromExistingKey(CLS_CTX, {
        strict: true,
    }),
];

/**
 * ClsCommonModule provides common providers for the ClsModule and ClsRootModule.
 */
@Module({
    providers: [...commonProviders],
    exports: [...commonProviders],
})
export class ClsCommonModule {}
