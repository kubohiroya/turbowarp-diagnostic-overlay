import {diagnosticToJson, normalizeDiagnostic} from './diagnostic.js';
import type {Diagnostic, DiagnosticInput} from './diagnostic.js';
import {accessibleDiagnosticText, renderDiagnosticSvg} from './svg-renderer.js';
import type {DiagnosticSvgOptions} from './svg-renderer.js';

export interface DiagnosticOverlayHost {
  showSvg(svg: string, accessibleText: string): void;
  clear(): void;
  isVisible(): boolean;
  dispose(): void;
}

export class DiagnosticOverlayController {
  private lastDiagnostic: Diagnostic | null = null;

  public constructor(
    private readonly host: DiagnosticOverlayHost,
    private readonly svgOptions: DiagnosticSvgOptions = {}
  ) {}

  public show(input: Diagnostic | DiagnosticInput): string {
    const diagnostic = normalizeDiagnostic(input);
    const svg = renderDiagnosticSvg(diagnostic, this.svgOptions);
    this.host.showSvg(svg, accessibleDiagnosticText(diagnostic));
    this.lastDiagnostic = diagnostic;
    return svg;
  }

  public render(input: Diagnostic | DiagnosticInput): string {
    return renderDiagnosticSvg(normalizeDiagnostic(input), this.svgOptions);
  }

  public clear(): void {
    this.host.clear();
    this.lastDiagnostic = null;
  }

  public isVisible(): boolean {
    return this.host.isVisible();
  }

  public lastDiagnosticJson(): string {
    return this.lastDiagnostic === null ? '' : diagnosticToJson(this.lastDiagnostic);
  }

  public dispose(): void {
    this.lastDiagnostic = null;
    this.host.dispose();
  }
}

export class BrowserStageOverlayHost implements DiagnosticOverlayHost {
  private readonly container: HTMLDivElement;
  private readonly parent: HTMLElement;
  private readonly window: (Window & typeof globalThis) | null;
  private resizeObserver: ResizeObserver | null = null;
  private changedParentPosition = false;
  private previousParentPosition = '';
  private disposed = false;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly document: Document = canvas.ownerDocument
  ) {
    const parent = canvas.parentElement;
    if (!parent) throw new Error('TurboWarp renderer canvas has no parent element.');
    this.parent = parent;
    this.window = document.defaultView;
    this.container = document.createElement('div');
    this.container.dataset.turbowarpDiagnosticOverlay = 'true';
    this.container.setAttribute('role', 'alert');
    this.container.setAttribute('aria-live', 'assertive');
    this.container.hidden = true;
    Object.assign(this.container.style, {
      position: 'absolute',
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: '2147483647'
    });

    const position = this.window?.getComputedStyle(parent).position ?? parent.style.position;
    if (!position || position === 'static') {
      this.previousParentPosition = parent.style.position;
      parent.style.position = 'relative';
      this.changedParentPosition = true;
    }

    parent.append(this.container);
    this.updateGeometry();
    this.window?.addEventListener('resize', this.updateGeometry);
    const ResizeObserverConstructor = this.window?.ResizeObserver;
    if (ResizeObserverConstructor) {
      const resizeObserver = new ResizeObserverConstructor(this.updateGeometry);
      this.resizeObserver = resizeObserver;
      resizeObserver.observe(canvas);
    }
  }

  public showSvg(svg: string, accessibleText: string): void {
    this.ensureActive();
    const Parser = this.window?.DOMParser ?? globalThis.DOMParser;
    if (!Parser) throw new Error('DOMParser is not available.');
    const parsed = new Parser().parseFromString(svg, 'image/svg+xml');
    if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') {
      throw new Error('Generated diagnostic SVG is invalid.');
    }
    const imported = this.document.importNode(
      parsed.documentElement,
      true
    ) as unknown as SVGSVGElement;
    imported.style.width = '100%';
    imported.style.height = '100%';
    imported.style.display = 'block';
    this.container.replaceChildren(imported);
    this.container.setAttribute('aria-label', accessibleText);
    this.updateGeometry();
    this.container.hidden = false;
  }

  public clear(): void {
    if (this.disposed) return;
    this.container.hidden = true;
    this.container.removeAttribute('aria-label');
    this.container.replaceChildren();
  }

  public isVisible(): boolean {
    return !this.disposed && !this.container.hidden;
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.window?.removeEventListener('resize', this.updateGeometry);
    this.container.remove();
    if (this.changedParentPosition && this.parent.style.position === 'relative') {
      this.parent.style.position = this.previousParentPosition;
    }
  }

  private readonly updateGeometry = (): void => {
    if (this.disposed) return;
    const canvasRect = this.canvas.getBoundingClientRect();
    const parentRect = this.parent.getBoundingClientRect();
    const left = canvasRect.left - parentRect.left + this.parent.scrollLeft;
    const top = canvasRect.top - parentRect.top + this.parent.scrollTop;
    Object.assign(this.container.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${canvasRect.width}px`,
      height: `${canvasRect.height}px`
    });
  };

  private ensureActive(): void {
    if (this.disposed) throw new Error('Diagnostic overlay host has been disposed.');
  }
}
