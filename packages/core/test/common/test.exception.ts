export class TestException extends Error {
    public response: any;
    constructor(response: any) {
        super('TestException');
        this.response = response;
    }
}
