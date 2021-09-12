import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ClsModule } from '../../src/cls.module';
import { ClsService } from '../../src/cls.service';

@Injectable()
export class TestHttpService {
    constructor(private readonly cls: ClsService) {}

    async hello() {
        return this.cls.get('hello');
    }
}

@Controller()
export class TestHttpController {
    constructor(
        private readonly service: TestHttpService,
        private readonly cls: ClsService,
    ) {}

    @Get()
    hello() {
        this.cls.set('hello', 'Hello world');
        return this.service.hello();
    }
}

@Module({
    imports: [ClsModule.register({ http: 'express' })],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
export class TestHttpApp {}
