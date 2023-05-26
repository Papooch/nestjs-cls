# Service Interface

The injectable `ClsService` provides the following API to manipulate the cls context:

The `S` type parameter is used as the type of custom `ClsStore`.

-   **_`set`_**`(key: keyof S, value: S[key]): void`  
    Set a value on the CLS context.

-   **_`get`_**`(): S`  
    Get the entire CLS context.

-   **_`get`_**`(key?: keyof S): S[key]`  
    Retrieve a value from the CLS context by key.

-   **_`has`_**`(key: keyof S): boolean`  
    Check if a key is in the CLS context.

-   **_`getId`_**`(): string;`  
    Retrieve the request ID (a shorthand for `cls.get(CLS_ID)`)

-   **_`enter`_**`(): void;`  
    Run any following code in a shared CLS context.

-   **_`enterWith`_**`(store: S): void;`  
    Run any following code in a new CLS context (while supplying the default store).

-   **_`run`_**`(callback: () => T): T;`  
    Run the callback in a shared CLS context.

-   **_`runWith`_**`(store: S, callback: () => T): T;`  
    Run the callback in a new CLS context (while supplying the default store).

-   **_`isActive`_**`(): boolean`  
    Whether the current code runs within an active CLS context.

-   **_`resolveProxyProviders`_**`(): Promise<void>`  
     Manually trigger resolution of Proxy Providers.
