import { createNamespace } from 'cls-hooked';
import { Injectable } from '@nestjs/common';

const requestNamespace = createNamespace('request');
@Injectable()
export class ClsService {
    set<T = any>(key: string, value: T) {
        try {
            return requestNamespace.set(key, value);
        } catch (e) {
            throw new Error(
                'No context available, please make sure to wrap any calls that depend on context with runWithContext or register the RequestContextMiddleware for all routes that use RequestContextService',
            );
        }
    }

    get<T = any>(key: string): T {
        return requestNamespace.get(key);
    }

    run<T = any>(callback: () => T) {
        return requestNamespace.runAndReturn(callback);
    }
}
