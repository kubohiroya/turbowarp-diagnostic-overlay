import type { DiagnosticOverlayController } from './overlay.js';
import type { ScratchApi } from './scratch.js';
type BlockArguments = Record<string, unknown>;
export declare class DiagnosticOverlayExtension {
    private readonly scratch;
    private readonly controller;
    private readonly runtime;
    private disposed;
    private controllerDisposed;
    private unregisterSourceEditors;
    private unregisterFixedInputEditors;
    /**
     * Loading a project disposes the runtime, which releases the editor registrations, but the
     * extension stays loaded for the next project. Register them again once that project has loaded.
     */
    private editorsReleased;
    constructor(scratch: ScratchApi, controller: DiagnosticOverlayController);
    getInfo(): Record<string, unknown>;
    showDiagnostic(args: BlockArguments): void;
    showDiagnosticJson(args: BlockArguments): void;
    clearDiagnosticOverlay(): void;
    diagnosticOverlayVisible(): boolean;
    diagnosticSvg(args: BlockArguments): string;
    lastDiagnosticJson(): string;
    /** Final disposal by the owner: nothing registers again after it. */
    readonly dispose: () => void;
    /** Every project load disposes the runtime; only the editor registrations come back after it. */
    private readonly handleRuntimeDisposed;
    private readonly handleProjectLoaded;
    private unregisterEditors;
    private disposeController;
    private toScratchBlock;
    private string;
    private severity;
}
export {};
//# sourceMappingURL=extension.d.ts.map