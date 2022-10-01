import { AsyncLocalStorage } from 'async_hooks';
import { ClsService } from './cls.service';

const als = new AsyncLocalStorage();
export const globalClsSevice = new ClsService(als);
