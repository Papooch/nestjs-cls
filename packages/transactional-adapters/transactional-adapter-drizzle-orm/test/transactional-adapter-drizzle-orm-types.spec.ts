import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const testDir = dirname(fileURLToPath(import.meta.url));

/**
 * Type-checks `source` the way a consumer's project would: as a file in this
 * package's `test` folder that imports the packages by name, so it sees their
 * built declarations (`yarn build` has to run first). Returns its errors.
 */
function typeCheck(source: string, options: ts.CompilerOptions) {
    const fileName = resolve(testDir, '__type-check__.ts');
    const compilerOptions: ts.CompilerOptions = {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2021,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        esModuleInterop: true,
        ...options,
    };
    const host = ts.createCompilerHost(compilerOptions);
    const { getSourceFile, fileExists, readFile } = host;
    host.fileExists = (f) => f === fileName || fileExists.call(host, f);
    host.readFile = (f) => (f === fileName ? source : readFile.call(host, f));
    host.getSourceFile = (f, ...rest) =>
        f === fileName
            ? ts.createSourceFile(f, source, ts.ScriptTarget.ES2021)
            : getSourceFile.call(host, f, ...rest);
    const program = ts.createProgram([fileName], compilerOptions, host);
    return ts
        .getPreEmitDiagnostics(program, program.getSourceFile(fileName))
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

const source = `
import { TransactionHost } from '@nestjs-cls/transactional';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';

new TransactionalAdapterDrizzleOrm<NodePgDatabase>({
    drizzleInstanceToken: 'DRIZZLE',
    defaultTxOptions: { isolationLevel: 'serializable' },
});

declare const txHost: TransactionHost<
    TransactionalAdapterDrizzleOrm<NodePgDatabase>
>;
txHost.tx.select();
txHost.withTransaction({ accessMode: 'read only' }, async () => {
    txHost.tx.select();
});
`;

describe('TransactionalAdapterDrizzleOrm types', () => {
    it.each([false, true])(
        'types TransactionHost#tx as the Drizzle client (exactOptionalPropertyTypes: %s)',
        (exactOptionalPropertyTypes) => {
            expect(typeCheck(source, { exactOptionalPropertyTypes })).toEqual(
                [],
            );
        },
    );
});
