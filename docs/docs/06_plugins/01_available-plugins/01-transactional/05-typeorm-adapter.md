import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# TypeOrm adapter

## Installation

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @nestjs-cls/transactional-adapter-typeorm
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @nestjs-cls/transactional-adapter-typeorm
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add @nestjs-cls/transactional-adapter-typeorm
```

</TabItem>
</Tabs>

## Registration

```ts

ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            imports: [
              // module in which the database instance is provided
              TypeOrmModule
            ],
            adapter: new TransactionalAdapterTypeOrm({
                // the injection token of the database instance
                dataSourceToken: DataSource,
            }),
        }),
    ],
}),
```
