# Using the ClsService Instance

All other methods of setting up the CLS context ultimately use the `ClsService#run` or `ClsService#enter` methods.

If all other attempts fail or you want to have a more fine-grained control over the CLS context, you can use `ClsService` instance to wrap any piece of code in a CLS context.

An example is available in the [Usage outside of web request](../03_features-and-use-cases/04_usage-outside-of-web-request.md) section.
