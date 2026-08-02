import type { Diagnostic, DiagnosticInput } from './diagnostic.js';
import type { DiagnosticSvgOptions } from './svg-renderer.js';
export interface DiagnosticOverlayHost {
    showSvg(svg: string, accessibleText: string): void;
    clear(): void;
    isVisible(): boolean;
    dispose(): void;
}
export declare class DiagnosticOverlayController {
    private readonly host;
    private readonly svgOptions;
    private lastDiagnostic;
    constructor(host: DiagnosticOverlayHost, svgOptions?: DiagnosticSvgOptions);
    show(input: Diagnostic | DiagnosticInput): string;
    render(input: Diagnostic | DiagnosticInput): string;
    clear(): void;
    isVisible(): boolean;
    lastDiagnosticJson(): string;
    dispose(): void;
}
export declare class BrowserStageOverlayHost implements DiagnosticOverlayHost {
    private readonly canvas;
    private readonly document;
    private readonly container;
    private readonly parent;
    private readonly window;
    private resizeObserver;
    private changedParentPosition;
    private previousParentPosition;
    private disposed;
    constructor(canvas: HTMLCanvasElement, document?: Document);
    showSvg(svg: string, accessibleText: string): void;
    clear(): void;
    isVisible(): boolean;
    dispose(): void;
    private readonly updateGeometry;
    private ensureActive;
}
//# sourceMappingURL=overlay.d.ts.map