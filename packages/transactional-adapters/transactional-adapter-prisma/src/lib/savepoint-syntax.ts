export type SQLFlavor =
    | 'postgresql'
    | 'mysql'
    | 'sqlite'
    | 'mssql'
    | 'azuresql'
    | 'mariadb'
    | 'oracle';

type SavepointStatementGetter = (savepointId: string) => string;
type SavepointStatementGetters = {
    save: SavepointStatementGetter;
    release: (savepointId: string) => string | null;
    rollback: SavepointStatementGetter;
};
type SavepointStatements = {
    save: string;
    release: string | null;
    rollback: string;
};

const standardSyntax: SavepointStatementGetters = {
    save: (id) => `SAVEPOINT ${id};`,
    release: (id) => `RELEASE SAVEPOINT ${id};`,
    rollback: (id) => `ROLLBACK TO SAVEPOINT ${id};`,
};

const microsoftSyntax: SavepointStatementGetters = {
    save: (id) => `SAVE TRANSACTION ${id};`,
    release: () => null,
    rollback: (id) => `ROLLBACK TRANSACTION ${id};`,
};

const oracleSyntax: SavepointStatementGetters = {
    save: (id) => `SAVEPOINT ${id};`,
    release: () => null,
    rollback: (id) => `ROLLBACK TO SAVEPOINT ${id};`,
};

const savepointStatementGetters = new Map<SQLFlavor, SavepointStatementGetters>(
    [
        ['postgresql', standardSyntax],
        ['mysql', standardSyntax],
        ['mariadb', standardSyntax],
        ['sqlite', standardSyntax],
        ['mssql', microsoftSyntax],
        ['azuresql', microsoftSyntax],
        ['oracle', oracleSyntax],
    ],
);

export function getSavepointStatements(
    flavor: SQLFlavor,
    id: string,
): SavepointStatements {
    const statements = savepointStatementGetters.get(flavor);
    if (!statements) {
        throw new InvalidSQLFlavorError(flavor);
    }
    return {
        save: statements.save(id),
        release: statements.release(id),
        rollback: statements.rollback(id),
    };
}

export class InvalidSQLFlavorError extends Error {
    constructor(flavor: string) {
        super(`Invalid SQL flavor: ${flavor}`);
        this.name = 'InvalidSQLFlavorError';
    }
}
