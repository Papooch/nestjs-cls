import { Module, ValueProvider } from '@nestjs/common';
import { ClsServiceManager } from '../cls-service-manager';
import { ClsService } from '../cls.service';

import { defaultProxyProviderTokens } from '../proxy-provider';
import { ProxyProviderManager } from '../proxy-provider/proxy-provider-manager';

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
