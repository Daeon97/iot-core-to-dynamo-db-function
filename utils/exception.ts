export abstract class Exception {
    constructor(message: string, stack?: string) {}
}

export class BadMessageFormatException extends Exception {
    constructor(message: string = "The message is badly formatted", stack?: string) {
        super(message, stack);
    }
}