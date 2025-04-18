# Testing

## Unit testing

Since the `ClsService` and any created Proxy providers are just another injectable providers, they can be entirely mocked out in unit tests using standard techniques.

:::note

Some [Plugins](../06_plugins/index.md) might require additional setup for unit tests. Please refer to the documentation for those plugins for more information.

:::

## E2E testing

In E2E tests, you should use the real `ClsService` implementation to test the entire application in a real-world scenario. Unless you're using any plugins that require special handling, you should not need to do anything special to set up E2E tests.

## Integration testing

In certain integration tests involving flows that span multiple modules but not the entire application, you might still want to use the real `ClsService` implementation for context propagation.

In that case, you will need to wrap the context-aware piece of code with a call to `ClsService#run` or `ClsService#runWith`.

### Example

```ts title="cat.service.ts"
@Injectable()
export class CatService {
    constructor(
        private readonly cls: ClsService,
        private readonly catRepository: CatRepository,
    ) {}

    getCatForUser() {
        const userId = this.cls.get('userId');
        return this.catRepository.getForUser(userId);
    }
}
```

```ts title="cat.service.spec.ts"
describe('CatService', () => {
  let service: CatService
  let cls: ClsService
  const mockCatRepository = createMock<CatRepository>()

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      // Set up most of the testing module as we normally would.
      providers: [
        CatService,
        {
          provide: CatRepository
          useValue: mockCatRepository
        }
      ],
      imports: [
        // Import the static version of ClsModule which only provides
        // the ClsService, but does not set up any enhancers
        // that would automatically set up the context on request.
        // highlight-start
        ClsModule
        // highlight-end
      ],
    }).compile()

    service = module.get(CatService)

    // Also retrieve the ClsService for later use.
    cls = module.get(ClsService)
  })

  describe('getCatForUser', () => {
    it('retrieves cat based on user id', async () => {
      const expectedUserId = 42
      mockCatRepository.getForUser.mockImplementationOnce(
        (id) => ({ userId: id })
      )

      // Wrap the test call in the `runWith` method
      // in which we can pass hand-crafted store values.
      // highlight-start
      const cat = await cls.runWith(
        // populate the store with mocked values for the test
        { userId: expectedUserId },
        () => service.getCatForUser()
      )
      // highlight-end

      expect(cat.userId).toEqual(expectedUserId)
    })
  })
})
```
