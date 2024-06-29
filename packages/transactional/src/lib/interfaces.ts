import {
    BeforeApplicationShutdown,
    OnApplicationBootstrap,
    OnApplicationShutdown,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';

export interface TransactionalAdapterOptions<TTx, TOptions> {
    wrapWithTransaction: (
        options: TOptions,
        fn: (...args: any[]) => Promise<any>,
        setTx: (client?: TTx) => void,
    ) => Promise<any>;
    getFallbackInstance: () => TTx;
}

export interface MergedTransactionalAdapterOptions<TTx, TOptions>
    extends TransactionalAdapterOptions<TTx, TOptions> {
    connectionName: string | undefined;
    enableTransactionProxy: boolean;
    defaultTxOptions: Partial<TOptions>;
}

export type TransactionalOptionsAdapterFactory<TConnection, TTx, TOptions> = (
    connection: TConnection,
) => TransactionalAdapterOptions<TTx, TOptions>;

export type OptionalLifecycleHooks = Partial<
    OnModuleInit &
        OnModuleDestroy &
        OnApplicationBootstrap &
        BeforeApplicationShutdown &
        OnApplicationShutdown
>;

export interface TransactionalAdapter<TConnection, TTx, TOptions>
    extends OptionalLifecycleHooks {
    /**
     * Token used to inject the `connection` into the adapter.
     * It is later used to create transactions.
     */
    connectionToken: any;

    /**
     * Default options for all transactions
     */
    defaultTxOptions?: Partial<TOptions>;

    /**
     * Function that accepts the `connection` based on the `connectionToken`
     *
     * Returns an object implementing the `TransactionalAdapterOptions` interface
     * with the `startTransaction` and `getTx` methods.
     */
    optionsFactory: TransactionalOptionsAdapterFactory<
        TConnection,
        TTx,
        TOptions
    >;

    /**
     * Whether this adapter support the {@link TransactionalPluginOptions.enableTransactionProxy} option.
     *
     * The default is `true`. Set to `false` to explicitly forbid this feature.
     *
     * When set to `false`, and {@link TransactionalPluginOptions.enableTransactionProxy} is `true`, an error will be thrown.
     */
    supportsTransactionProxy?: boolean;
}

export interface TransactionalPluginOptions<TConnection, TTx, TOptions> {
    /**
     * An instance of the transactional adapter.
     */
    adapter: TransactionalAdapter<TConnection, TTx, TOptions>;
    /**
     * An array of modules that export providers required by the adapter.
     */
    imports?: any[];
    /**
     * An optional name of the connection. Useful when there are multiple TransactionalPlugins registered in the app.
     */
    connectionName?: string;
    /**
     * Whether to enable injecting the Transaction instance directly using `@InjectTransaction()`
     *
     * Default: `false`
     *
     * Note: Not all adapters support this feature, please refer to the docs for the adapter you are using.
     */
    enableTransactionProxy?: boolean;
}

export type TTxFromAdapter<TAdapter> = TAdapter extends TransactionalAdapter<
    any,
    infer TClient,
    any
>
    ? TClient
    : never;

export type TOptionsFromAdapter<TAdapter> =
    TAdapter extends TransactionalAdapter<any, any, infer TOptions>
        ? TOptions
        : never;

export type Transaction<TAdapter extends TransactionalAdapter<any, any, any>> =
    TTxFromAdapter<TAdapter>;
