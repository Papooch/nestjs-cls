/**
 * Returns a symbol under which the given proxy provider is stored in the CLS.
 */
export function getProxyProviderSymbol(
    proxyToken: symbol | string | { name: string },
) {
    if (typeof proxyToken === 'symbol') return proxyToken;
    if (typeof proxyToken === 'string') return Symbol.for(proxyToken);
    if (proxyToken.name) return Symbol.for(proxyToken.name);
    return Symbol.for(proxyToken.toString());
}
