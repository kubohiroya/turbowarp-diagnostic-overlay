import type { DiagnosticOverlayController } from './overlay.js';
import type { ScratchApi } from './scratch.js';
type BlockArguments = Record<string, unknown>;
export declare class DiagnosticOverlayExtension {
    private readonly scratch;
    private readonly controller;
    private readonly runtime;
    private disposed;
    constructor(scratch: ScratchApi, controller: DiagnosticOverlayController);
    getInfo(): Record<string, unknown>;
    showDiagnostic(args: BlockArguments): void;
    showDiagnosticJson(args: BlockArguments): void;
    clearDiagnosticOverlay(): void;
    diagnosticOverlayVisible(): boolean;
    diagnosticSvg(args: BlockArguments): string;
    lastDiagnosticJson(): string;
    readonly dispose: () => void;
    private readonly clearOnProjectLoad;
    private toScratchBlock;
    private string;
    private severity;
}
export {};
//# sourceMappingURL=extension.d.ts.map