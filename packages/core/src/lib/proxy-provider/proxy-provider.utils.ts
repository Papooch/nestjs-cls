import { Type } from '@nestjs/common';
import { Injector } from '@nestjs/core/injector/injector';

const injector = new Injector();

export function reflectClassConstructorParams(Class: Type) {
    return injector.reflectConstructorParams(Class);
}

export function reflectAllClassDependencies(Class: Type) {
    const constructorParams = reflectClassConstructorParams(Class);
    const properties = injector
        .reflectProperties(Class)
        .map((prop) => prop.name);
    return [...constructorParams, ...properties];
}
