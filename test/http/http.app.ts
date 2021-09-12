import { Controller, Get, Injectable } from '@nestjs/common';
import { ClsService } from '../../src/cls.service';

@Injectable()
export class TestHttpService {
    constructor(private readonly cls: ClsService) {}

    async hello() {
        return this.cls.get('hello');
    }
}

@Controller('/')
export class TestHttpController {
    constructor(
        private readonly service: TestHttpService,
        private readonly cls: ClsService,
    ) {}

    @Get('hello')
    hello() {
        this.cls.set('hello', 'Hello world');
        return this.service.hello();
    }
}
