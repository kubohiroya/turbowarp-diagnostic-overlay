import { DiagnosticOverlayExtension } from './extension.js';
import { DiagnosticOverlayController } from './overlay.js';
import type { DiagnosticOverlayHost } from './overlay.js';
import type { ScratchApi } from './scratch.js';
import type { DiagnosticSvgOptions } from './svg-renderer.js';
export * from './config.js';
export * from './diagnostic.js';
export * from './overlay.js';
export * from './scratch.js';
export * from './svg-renderer.js';
export { DiagnosticOverlayExtension };
export interface DiagnosticOverlayCompositionOptions {
    host?: DiagnosticOverlayHost;
    svg?: DiagnosticSvgOptions;
}
export interface DiagnosticOverlayComposition {
    extension: DiagnosticOverlayExtension;
    controller: DiagnosticOverlayController;
    host: DiagnosticOverlayHost;
}
export declare function createDiagnosticOverlayComposition(scratch: ScratchApi, options?: DiagnosticOverlayCompositionOptions): DiagnosticOverlayComposition;
//# sourceMappingURL=composition.d.ts.map