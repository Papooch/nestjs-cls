import { Module, ValueProvider } from '@nestjs/common';
import { ClsServiceManager } from '../cls-service-manager.js';
import { ClsService } from '../cls.service.js';

import { defaultProxyProviderTokens } from '../proxy-provider/index.js';
import { ProxyProviderManager } from '../proxy-provider/proxy-provider-manager.js';

const clsServiceProvider: ValueProvider<ClsService> = {
    provide: ClsService,
    useValue: ClsServiceManager.getClsService(),
};

const commonProviders = [
    clsServiceProvider,
    ...[...defaultProxyProviderTokens].map((token) =>
        ProxyProviderManager.createProxyProviderFromExistingKey(token, {
            strict: true,
        }),
    ),
];

/**
 * ClsCommonModule provides common providers for the ClsModule and ClsRootModule.
 */
@Module({
    providers: [...commonProviders],
    exports: [...commonProviders],
})
export class ClsCommonModule {}
