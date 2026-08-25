import { InjectionToken, OptionalFactoryDependency } from '@nestjs/common';
import { UnknownDependenciesException } from '@nestjs/core/errors/exceptions/unknown-dependencies.exception';
import { ClsService } from '../cls.service';
import { isProxyClassProvider } from './proxy-provider.functions';
import {
    ProxyClassProviderDefinition,
    ProxyFactoryProviderDefinition,
    ProxyProviderDefinition,
} from './proxy-provider.interfaces';
import {
    ProxyProviderInvalidReturnTypeException,
    ProxyProviderNotRegisteredException,
    ProxyProvidersResolutionTimeoutException,
    UnknownProxyDependenciesException,
} from './proxy-provider.exceptions';
import { defaultProxyProviderTokens } from './proxy-provider.constants';
import { getProxyProviderSymbol } from './get-proxy-provider-symbol';
import {
    Promise_withResolvers,
    PromiseWithResolvers,
} from '../../utils/promise-with-resolvers.polyfill';

/**
 * see {@link ProxyProvidersResolver.getOrCreateCurrentProxyPromisesMap}
 */
type ProxyProviderPromisesMap = Map<symbol, Promise<unknown>>;

const CLS_PROXY_PROVIDER_PROMISES_MAP = Symbol('CLS_PROVIDER_PROMISES_MAP');

/**
 * A Set stored in the CLS context that tracks which Proxy Providers have been
 * resolved. Tracking resolution separately from the stored value allows
 * distinguishing "not resolved yet" from "resolved to null or undefined".
 */
const CLS_PROXY_PROVIDER_RESOLVED_SET = Symbol('CLS_PROVIDER_RESOLVED_SET');

export class ProxyProvidersResolver {
    private readonly proxyProviderDependenciesMap = new Map<symbol, symbol[]>();

    constructor(
        private readonly cls: ClsService,
        private readonly proxyProviderMap: Map<symbol, ProxyProviderDefinition>,
    ) {
        this.proxyProviderMap.forEach((provider) => {
            // find each Proxy Providers' dependencies that are also Proxy Providers
            // and store those in a separate map
            this.proxyProviderDependenciesMap.set(
                provider.symbol,
                provider.dependencies
                    .map(extractInjectionToken)
                    .map(getProxyProviderSymbol)
                    .filter((symbol) => !defaultProxyProviderTokens.has(symbol))
                    .filter((symbol) => proxyProviderMap.has(symbol)),
            );
        });
    }

    /**
     * Resolves all Proxy Providers that have been registered,
     * or only the ones that are passed as an argument and their dependencies.
     */
    async resolve(providerSymbols?: symbol[]) {
        const providerSymbolsToResolve = providerSymbols?.length
            ? providerSymbols
            : Array.from(this.proxyProviderMap.keys());

        const resolutionPromisesMap = this.getOrCreateCurrentProxyPromisesMap();

        const allNeededProviderSymbols = this.getAllNeededProviderSymbols(
            providerSymbolsToResolve,
        );

        const promiseWithResolversMap = new Map<symbol, PromiseWithResolvers>();

        for (const dep of allNeededProviderSymbols) {
            const isBeingResolved = resolutionPromisesMap.has(dep);
            if (!isBeingResolved) {
                const promiseWithResolvers = Promise_withResolvers();
                promiseWithResolversMap.set(dep, promiseWithResolvers);
                resolutionPromisesMap.set(dep, promiseWithResolvers.promise);
            }
        }

        for (const [dep, promiseWithResolvers] of promiseWithResolversMap) {
            void this.resolveProxyProvider(
                dep,
                promiseWithResolvers,
                resolutionPromisesMap,
            );
        }

        const timeout = 10_000;
        const timeoutPromise = Promise_withResolvers();
        const timeoutHandle = setTimeout(() => {
            timeoutPromise.reject(
                ProxyProvidersResolutionTimeoutException.create(timeout),
            );
        }, timeout);
        try {
            await Promise.race([
                timeoutPromise.promise,
                Promise.all(resolutionPromisesMap.values()),
            ]);
        } finally {
            clearTimeout(timeoutHandle);
        }
    }

    /**
     * ProxyProviderResolutionPromisesMap is a map scoped to the
     * current CLS context that holds reference to the Promises of
     * all Proxy Providers (those that have been resolved and those
     * that are being resolved)
     *
     * It is used to prevent multiple concurrent resolutions of the same
     * Proxy Provider and also to ensure that all Proxy Providers are
     * resolved in the correct order (dependencies first)
     */
    private getOrCreateCurrentProxyPromisesMap() {
        const resolutionPromisesMap =
            this.cls.get<ProxyProviderPromisesMap>(
                CLS_PROXY_PROVIDER_PROMISES_MAP,
            ) ?? new Map();
        this.cls.setIfUndefined(
            CLS_PROXY_PROVIDER_PROMISES_MAP,
            resolutionPromisesMap,
        );
        return resolutionPromisesMap;
    }

    /**
     * ResolvedSet is a Set scoped to the current CLS context that tracks
     * which Proxy Providers have been successfully resolved. Tracking this
     * separately from the stored value allows distinguishing "not resolved yet"
     * from "resolved to null or undefined" (which would be an error, but we
     * use this set so the check is unambiguous regardless of the stored value).
     */
    private getOrCreateCurrentResolvedSet(): Set<symbol> {
        const resolvedSet =
            this.cls.get<Set<symbol>>(CLS_PROXY_PROVIDER_RESOLVED_SET) ??
            new Set<symbol>();
        this.cls.setIfUndefined(CLS_PROXY_PROVIDER_RESOLVED_SET, resolvedSet);
        return resolvedSet;
    }

    /**
     * Gets a set of all Proxy Provider symbols that need to be resolved
     * and symbols of their dependencies (that have not been resolved yet)
     */
    private getAllNeededProviderSymbols(providerSymbols: symbol[]) {
        const resolvedSet = this.getOrCreateCurrentResolvedSet();
        const result = new Set<symbol>();
        const queue = providerSymbols.filter(
            (s) => !resolvedSet.has(s) && !this.cls.has(s),
        );
        while (queue.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const current = queue.pop()!;
            if (result.has(current)) continue;
            result.add(current);
            const deps = this.proxyProviderDependenciesMap.get(current) ?? [];
            for (const dep of deps) {
                if (!result.has(dep) && !resolvedSet.has(dep)) {
                    queue.push(dep);
                }
            }
        }
        return result;
    }

    private async resolveProxyProvider(
        providerSymbol: symbol,
        ownPromise: PromiseWithResolvers,
        dependencyPromises: ProxyProviderPromisesMap,
    ) {
        try {
            const providerDefinition =
                this.proxyProviderMap.get(providerSymbol);
            if (!providerDefinition) {
                throw ProxyProviderNotRegisteredException.create(
                    providerSymbol,
                );
            }

            const ownDependencySymbols =
                this.proxyProviderDependenciesMap.get(providerSymbol) ?? [];

            const ownDependencyPromises = ownDependencySymbols.map((dep) =>
                dependencyPromises.get(dep),
            );

            await Promise.all(ownDependencyPromises);
            const providerInstance =
                await this.resolveProxyProviderInstance(providerDefinition);

            const instanceType = typeof providerInstance;
            if (
                providerInstance === null ||
                providerInstance === undefined ||
                (instanceType !== 'object' && instanceType !== 'function')
            ) {
                throw ProxyProviderInvalidReturnTypeException.create(
                    providerSymbol,
                    providerInstance,
                );
            }

            this.cls.set(providerSymbol, providerInstance);
            const resolvedSet = this.getOrCreateCurrentResolvedSet();
            resolvedSet.add(providerSymbol);
            return ownPromise.resolve();
        } catch (e) {
            return ownPromise.reject(e);
        }
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

function extractInjectionToken(
    dep: InjectionToken | OptionalFactoryDependency,
): InjectionToken {
    if (dep !== null && typeof dep === 'object' && 'token' in dep) {
        return dep.token;
    }
    return dep as InjectionToken;
}
