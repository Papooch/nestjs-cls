export interface TransactionalAdapterOptions<TClient, TOptions> {
    startTransaction: (
        options: TOptions,
        fn: (...args: any[]) => Promise<any>,
        setClient: (client: TClient) => void,
    ) => Promise<any>;
    getClient: () => TClient;
}

export type TransactionalOptionsAdapterFactory<TConnection, TClient, TOptions> =
    (connection: TConnection) => TransactionalAdapterOptions<TClient, TOptions>;

export interface TransactionalAdapter<TConnection, TClient, TOptions> {
    optionsFactory: TransactionalOptionsAdapterFactory<
        TConnection,
        TClient,
        TOptions
    >;
    connectionToken: any;
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
