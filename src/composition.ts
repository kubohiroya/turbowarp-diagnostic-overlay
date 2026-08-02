import {DiagnosticOverlayExtension} from './extension.js';
import {BrowserStageOverlayHost, DiagnosticOverlayController} from './overlay.js';
import type {DiagnosticOverlayHost} from './overlay.js';
import type {ScratchApi} from './scratch.js';
import type {DiagnosticSvgOptions} from './svg-renderer.js';

export * from './config.js';
export * from './diagnostic.js';
export * from './overlay.js';
export * from './scratch.js';
export * from './svg-renderer.js';
export {DiagnosticOverlayExtension};

export interface DiagnosticOverlayCompositionOptions {
  host?: DiagnosticOverlayHost;
  svg?: DiagnosticSvgOptions;
}

export interface DiagnosticOverlayComposition {
  extension: DiagnosticOverlayExtension;
  controller: DiagnosticOverlayController;
  host: DiagnosticOverlayHost;
}

export function createDiagnosticOverlayComposition(
  scratch: ScratchApi,
  options: DiagnosticOverlayCompositionOptions = {}
): DiagnosticOverlayComposition {
  const runtime = scratch.vm.runtime;
  const host = options.host ?? new BrowserStageOverlayHost(runtime.renderer.canvas);
  const controller = new DiagnosticOverlayController(host, {
    width: runtime.stageWidth ?? 480,
    height: runtime.stageHeight ?? 360,
    ...options.svg
  });
  const extension = new DiagnosticOverlayExtension(scratch, controller);
  return {extension, controller, host};
}
