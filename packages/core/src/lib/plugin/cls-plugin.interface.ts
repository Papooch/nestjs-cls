import { Provider } from '@nestjs/common';
import { ClsService } from '../cls.service';

export interface ClsPlugin {
    name: string;
    onClsInit?: (cls: ClsService) => void | Promise<void>;
    onModuleInit?: () => void | Promise<void>;
    onModuleDestroy?: () => void | Promise<void>;
    imports?: any[];
    providers?: Provider[];
    exports?: any[];
}
