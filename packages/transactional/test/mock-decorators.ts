export function MetadataDefiningDecorator(): MethodDecorator {
    return (
        _target: any,
        _propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<any>,
    ) => {
        Reflect.defineMetadata('testproperty', 'testvalue', descriptor.value);
        return descriptor;
    };
}

export function PropertyDefiningDecorator(): MethodDecorator {
    return (
        _target: any,
        _propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<any>,
    ) => {
        descriptor.value.testproperty = 'testvalue';
        return descriptor;
    };
}
