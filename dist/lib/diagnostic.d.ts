export declare const DIAGNOSTIC_SEVERITIES: readonly ["info", "warning", "error", "fatal"];
export type DiagnosticSeverity = (typeof DIAGNOSTIC_SEVERITIES)[number];
export interface DiagnosticSource {
    name?: string;
    line?: number;
    column?: number;
    excerpt?: string;
}
export interface Diagnostic {
    severity: DiagnosticSeverity;
    code: string;
    message: string;
    detail?: string;
    source?: DiagnosticSource;
}
export interface DiagnosticInput {
    severity: DiagnosticSeverity | string;
    code: string;
    message: string;
    detail?: string;
    source?: DiagnosticSource;
}
export declare class DiagnosticValidationError extends Error {
    readonly path: string;
    constructor(path: string, message: string);
}
export declare function parseDiagnosticJson(input: string): Diagnostic;
export declare function normalizeDiagnostic(value: unknown): Diagnostic;
export declare function diagnosticToJson(diagnostic: Diagnostic): string;
//# sourceMappingURL=diagnostic.d.ts.map