import { UnknownDependenciesException } from '@nestjs/core/errors/exceptions/unknown-dependencies.exception';
import { ClsService } from '../cls.service';
import {
    ProxyProviderNotRegisteredException,
    UnknownProxyDependenciesException,
} from './proxy-provider.exceptions';
import { isProxyClassProvider } from './proxy-provider.functions';
import {
    ProxyClassProviderDefinition,
    ProxyFactoryProviderDefinition,
    ProxyProviderDefinition,
} from './proxy-provider.interfaces';

export class ProxyProvidersResolver {
    private readonly proxyProviderDependenciesMap = new Map<symbol, symbol[]>();

    constructor(
        private readonly cls: ClsService,
        private readonly proxyProviderMap: Map<symbol, ProxyProviderDefinition>,
    ) {}

    /**
     * Resolves all Proxy Providers that have been registered,
     * or only the ones that are passed as an argument and their dependencies.
     */
    async resolve(providerSymbols?: symbol[]) {
        const providerSymbolsToResolve = providerSymbols?.length
            ? providerSymbols
            : Array.from(this.proxyProviderMap.keys());

        await Promise.all(
            providerSymbolsToResolve
                .filter((providerSymbol) => !this.cls.get(providerSymbol))
                .map((providerSymbol) =>
                    this.resolveProxyProvider(providerSymbol),
                ),
        );
    }

    private async resolveProxyProvider(providerSymbol: symbol) {
        const providerDefinition = this.proxyProviderMap.get(providerSymbol);
        if (!providerDefinition) {
            throw ProxyProviderNotRegisteredException.create(providerSymbol);
        }

        const providerInstance =
            await this.resolveProxyProviderInstance(providerDefinition);
        this.cls.set(providerSymbol, providerInstance);
    }

    private resolveProxyProviderInstance(provider: ProxyProviderDefinition) {
        let resolution: Promise<unknown>;
        if (isProxyClassProvider(provider)) {
            resolution = this.resolveProxyClassProviderInstance(provider);
        } else {
            resolution = this.resolveProxyFactoryProviderInstance(provider);
        }
        return resolution;
    }

    private async resolveProxyClassProviderInstance(
        provider: ProxyClassProviderDefinition,
    ) {
        const moduleRef = provider.moduleRef;
        const Provider = provider.useClass;

        try {
            return await moduleRef.create(Provider);
        } catch (error: unknown) {
            if (!(error instanceof UnknownDependenciesException)) throw error;
            throw UnknownProxyDependenciesException.create(error, Provider);
        }
    }

    private async resolveProxyFactoryProviderInstance(
        provider: ProxyFactoryProviderDefinition,
    ) {
        const injected = provider.injected;
        return await provider.useFactory.apply(null, injected);
    }
}
