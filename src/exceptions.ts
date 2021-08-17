export class Exception extends Error {
    __proto__: Error;
    constructor(message?: string) {
        const trueProto = new.target.prototype;
        super(message);
        this.__proto__ = trueProto;
    }
}

export class IOException<T> extends Exception {
    constructor(message?: string, public reason?: T) {
        super(`IOException exception. ${message}`);
    }
}

export class RuntimeException<T> extends Exception {
    constructor(message?: string, public reason?: T) {
        super(`RuntimeException exception. ${message}`);
    }
}

export class IllegalArgumentException<T> extends Exception {
    constructor(message?: string, public reason?: T) {
        super(`IllegalArgumentException exception. ${message}`);
    }
}

export class ValidationException<T> extends Exception {
    constructor(message?: string, public reason?: T) {
        super(`ValidationException exception. ${message}`);
    }
}

export class PermissionException<T> extends Exception {
    constructor(message?: string, public reason?: T) {
        super(`PermissionException exception. ${message}`);
    }
}

export class BadRequestException<T> extends Exception {
    constructor(message?: string, public reason?: T) {
        super(`BadRequestException exception. ${message}`);
    }
}

export class NetworkException<T> extends Exception {
    constructor(message?: string, public reason?: T) {
        super(`NetworkException exception. ${message}`);
    }
}

export class NotImplementedException<T> extends Exception {
    constructor(message?: string, public reason?: T) {
        super(`NotImplementedException exception. ${message}`);
    }
}
