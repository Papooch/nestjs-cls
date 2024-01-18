export interface TransactionalAdapterOptions<TClient, TOptions> {
    startTransaction: (
        options: TOptions,
        fn: (...args: any[]) => Promise<any>,
        setClient: (client?: TClient) => void,
    ) => Promise<any>;
    getClient: () => TClient;
}

export type TransactionalOptionsAdapterFactory<TConnection, TClient, TOptions> =
    (connection: TConnection) => TransactionalAdapterOptions<TClient, TOptions>;

export interface TransactionalAdapter<TConnection, TClient, TOptions> {
    /**
     * Token used to inject the `connection` into the adapter.
     * It is later used to create transactions.
     */
    connectionToken: any;

    /**
     * Function that accepts the `connection` based on the `connectionToken`
     *
     * Returns an object implementing the `TransactionalAdapterOptions` interface
     * with the `startTransaction` and `getClient` methods.
     */
    optionsFactory: TransactionalOptionsAdapterFactory<
        TConnection,
        TClient,
        TOptions
    >;
}

export interface TransactionalPluginOptions<TConnection, TClient, TOptions> {
    adapter: TransactionalAdapter<TConnection, TClient, TOptions>;
    imports?: any[];
}

export type TClientFromAdapter<TAdapter> =
    TAdapter extends TransactionalAdapter<any, infer TClient, any>
        ? TClient
        : never;

export type TOptionsFromAdapter<TAdapter> =
    TAdapter extends TransactionalAdapter<any, any, infer TOptions>
        ? TOptions
        : never;
