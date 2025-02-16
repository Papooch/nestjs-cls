import { Type } from '@nestjs/common';
import { Injector } from '@nestjs/core/injector/injector';

const injector = new Injector();

export function reflectClassConstructorParams(Class: Type) {
    return injector.reflectConstructorParams(Class);
}
