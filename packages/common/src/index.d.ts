export interface Logger {
    info(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
}
export declare class ConsoleLogger implements Logger {
    info(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
}
export declare class DomainError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
//# sourceMappingURL=index.d.ts.map