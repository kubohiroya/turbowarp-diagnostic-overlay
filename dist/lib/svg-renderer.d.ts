import type { Diagnostic, DiagnosticInput } from './diagnostic.js';
export interface DiagnosticSvgOptions {
    width?: number;
    height?: number;
    maxMessageLines?: number;
    maxDetailLines?: number;
    maxExcerptLines?: number;
}
export declare function renderDiagnosticSvg(input: Diagnostic | DiagnosticInput, options?: DiagnosticSvgOptions): string;
export declare function accessibleDiagnosticText(diagnostic: Diagnostic): string;
export declare function escapeXml(value: string): string;
//# sourceMappingURL=svg-renderer.d.ts.map