import { Type } from '@nestjs/common';
import { UnknownDependenciesException } from '@nestjs/core/errors/exceptions/unknown-dependencies.exception';

export class UnknownProxyDependenciesException extends Error {
    name = UnknownProxyDependenciesException.name;

    static create(error: UnknownDependenciesException, Provider: Type) {
        const expectedParams = Reflect.getMetadata(
            'design:paramtypes',
            Provider,
        );
        const foundParams = this.extractDependencyParams(error);
        const notFoundParamIndex = foundParams.findIndex((it) => it == '?');
        let notFoundParamName = expectedParams[notFoundParamIndex]?.name;
        if (!notFoundParamName) {
            notFoundParamName = Reflect.getMetadata('self:paramtypes', Provider)
                ?.find((param: any) => param?.index == notFoundParamIndex)
                .param.toString();
        }
        const message = this.composeMessage(
            Provider.name,
            foundParams.join(', '),
            notFoundParamName,
            notFoundParamIndex,
        );
        return new UnknownProxyDependenciesException(message);
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

export class ProxyProviderNotDecoratedException extends Error {
    name = ProxyProviderNotDecoratedException.name;

    static create(Provider: Type) {
        const message = `Cannot create a Proxy provider for ${Provider.name}. The class must be explicitly decorated with the @InjectableProxy() decorator to distinguish it from a regular provider.`;
        return new ProxyProviderNotDecoratedException(message);
    }
}
