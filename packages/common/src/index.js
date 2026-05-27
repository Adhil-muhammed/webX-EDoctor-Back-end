"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainError = exports.ConsoleLogger = void 0;
class ConsoleLogger {
    info(message, context) {
        console.info(message, context ?? {});
    }
    error(message, context) {
        console.error(message, context ?? {});
    }
}
exports.ConsoleLogger = ConsoleLogger;
class DomainError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
exports.DomainError = DomainError;
//# sourceMappingURL=index.js.map