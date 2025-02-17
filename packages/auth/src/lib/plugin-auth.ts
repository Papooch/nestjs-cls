import { ClsPluginBase, ClsPluginHooks, ClsService } from 'nestjs-cls';

const CLS_AUTH = Symbol('CLS_AUTH');
const CLS_AUTH_OPTIONS = Symbol('CLS_AUTH_OPTIONS');

interface ClsAuthCallbacks<T> {
    authObjectFactory: (cls: ClsService) => T;
    permissionResolutionStrategy: (authObject: T, cls: ClsService) => boolean;
}

export interface ClsPluginAuthOptions<T> {
    imports?: any[];
    inject: any[];
    useFactory: (...args: any[]) => ClsAuthCallbacks<T>;
}

export class ClsPluginAuth extends ClsPluginBase {
    readonly version = 2;
    readonly name = 'cls-plugin-auth';

    constructor(private readonly options: ClsPluginAuthOptions<any>) {
        super();
        this.imports.push(...(options.imports ?? []));
        this.providers = [
            {
                provide: CLS_AUTH_OPTIONS,
                inject: options.inject,
                useFactory: options.useFactory,
            },
            {
                provide: this.hooksProviderToken,
                inject: [CLS_AUTH_OPTIONS],
                useFactory: (
                    options: ClsAuthCallbacks<any>,
                ): ClsPluginHooks => {
                    return {
                        afterSetup: (cls: ClsService) => {
                            const authObject = options.authObjectFactory(cls);
                            cls.set(CLS_AUTH, authObject);
                        },
                    };
                },
            },
        ];
        this.exports = [this.name];
    }
}
