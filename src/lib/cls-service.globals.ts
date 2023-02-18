import { AsyncLocalStorage } from 'async_hooks';
import { ClsService } from './cls.service';

const als = new AsyncLocalStorage();
export const globalClsService = new ClsService(als);
