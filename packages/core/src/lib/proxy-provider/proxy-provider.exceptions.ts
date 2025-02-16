import { Type } from '@nestjs/common';
import { UnknownDependenciesException } from '@nestjs/core/errors/exceptions/unknown-dependencies.exception';
import { defaultProxyProviderTokens } from './proxy-provider.constants';
import { reflectClassConstructorParams } from './proxy-provider.utils';

export class ProxyProviderError extends Error {
    name = this.constructor.name;
}

export class UnknownProxyDependenciesException extends ProxyProviderError {
    static create(error: UnknownDependenciesException, Provider: Type) {
        const expectedParams = reflectClassConstructorParams(Provider);
        const foundParams = this.extractDependencyParams(error);
        const notFoundParamIndex = foundParams.findIndex((it) => it == '?');
        let notFoundParamName = expectedParams[notFoundParamIndex]?.name;

        const message = this.composeMessage(
            Provider.name,
            foundParams.join(', '),
            notFoundParamName ?? 'Unknown',
            notFoundParamIndex,
        );
        return new this(message);
    }

    private static extractDependencyParams(
        error: UnknownDependenciesException,
    ) {
        // matches the parameters from NestJS's error message:
        // e.g: "Nest can't resolve dependencies of the Something (Cats, ?). [...]"
        // returns ['Cats', '?']
        return error.message.match(/\w+ \((.*?)\)./)?.[1].split(', ') ?? [];
    }

    private static composeMessage(
        providerName: string,
        foundParamsString: string,
        notFoundParamName: string,
        notFoundIndex: number,
    ) {
        return (
            `Cannot create Proxy provider ${providerName} (${foundParamsString}). ` +
            `The argument ${notFoundParamName} at index [${notFoundIndex}] was not found in the ClsModule Context.\n\n` +
            `Potential solutions:\n` +
            `- If ${notFoundParamName} is a provider from a separate module, make sure to import the module in "ClsModule.forFeatureAsync()" registration`
        );
    }
}

export class ProxyProviderNotDecoratedException extends ProxyProviderError {
    static create(Provider: Type) {
        const message = `Cannot create a Proxy provider for ${Provider.name}. The class must be explicitly decorated with the @InjectableProxy() decorator to distinguish it from a regular provider.`;
        return new this(message);
    }
}

export class ProxyProviderNotRegisteredException extends ProxyProviderError {
    static create(providerSymbol: symbol) {
        const message = `Cannot resolve a Proxy provider for symbol "${providerSymbol.description}", because it was not registered using "ClsModule.forFeature()" or "ClsModule.forFeatureAsync()".`;
        return new this(message);
    }
}

export class ProxyProviderNotResolvedException extends ProxyProviderError {
    static create(providerSymbol: symbol | string, propName?: string) {
        const isDefaultProxyProvider = defaultProxyProviderTokens.has(
            providerSymbol as any,
        );
        const providerName =
            typeof providerSymbol == 'string'
                ? providerSymbol
                : (providerSymbol.description ?? 'unknown');
        let message: string;
        if (propName) {
            message = `Cannot access the property "${propName}" on the Proxy provider`;
        } else {
            message = 'Cannot call the Proxy provider';
        }
        if (isDefaultProxyProvider) {
            message += ` ${providerName} because because the value for ${providerName} does not exist in the CLS. Make sure to enable the "${this.formatEnableOptionName(providerName)}" option in the enhancer options in the "ClsModule.forRoot()" method.`;
        } else {
            message += ` ${providerName} because is has not been resolved yet and has been registered with the "strict: true" option. Make sure to call "await cls.resolveProxyProviders()" before accessing the Proxy provider.`;
        }
        return new this(message);
    }

    private static formatEnableOptionName(providerName: string) {
        const name = providerName.replace('CLS_', '').toLowerCase();
        return 'save' + name.charAt(0).toUpperCase() + name.slice(1);
    }
}

export class ProxyProvidersResolutionTimeoutException extends ProxyProviderError {
    static create(timeout: number) {
        const message = `Proxy Providers could not be resolved within the specified timeout of ${timeout}ms, possibly due to a circular dependency. Make sure to avoid circular dependencies in your Proxy Providers.`;
        return new this(message);
    }
}
