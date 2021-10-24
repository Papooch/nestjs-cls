export class TestException extends Error {
    public response: any;
    public extensions: { a: 1 };
    constructor(response: any) {
        super('TestException');
        this.response = response;
    }
}
