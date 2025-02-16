import { CLS_CTX, CLS_REQ, CLS_RES } from '../cls.constants';

export const CLS_PROXY_METADATA_KEY = '__cls_proxy__';

export const defaultProxyProviderTokens = new Set([CLS_REQ, CLS_RES, CLS_CTX]);
