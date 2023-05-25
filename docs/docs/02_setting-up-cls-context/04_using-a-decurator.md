# Using a Decorator

The `@UseCls()` decorator can be used at a method level to declaratively wrap the method with a `cls.run()` call. This method should only be used [outside of the context of a web request](#usage-outside-of-web-request).

:::info

Please keep in mind, that since the CLS context initialization _can_ be async, the `@UseCls()` decorator can _only_ be used on _async_ function (those that return a `Promise`).

:::
