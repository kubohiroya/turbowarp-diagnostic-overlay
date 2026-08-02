import { diagnosticToJson, normalizeDiagnostic } from './diagnostic.js';
import { accessibleDiagnosticText, renderDiagnosticSvg } from './svg-renderer.js';
export class DiagnosticOverlayController {
    host;
    svgOptions;
    lastDiagnostic = null;
    constructor(host, svgOptions = {}) {
        this.host = host;
        this.svgOptions = svgOptions;
    }
    show(input) {
        const diagnostic = normalizeDiagnostic(input);
        const svg = renderDiagnosticSvg(diagnostic, this.svgOptions);
        this.host.showSvg(svg, accessibleDiagnosticText(diagnostic));
        this.lastDiagnostic = diagnostic;
        return svg;
    }
    render(input) {
        return renderDiagnosticSvg(normalizeDiagnostic(input), this.svgOptions);
    }
    clear() {
        this.host.clear();
        this.lastDiagnostic = null;
    }
    isVisible() {
        return this.host.isVisible();
    }
    lastDiagnosticJson() {
        return this.lastDiagnostic === null ? '' : diagnosticToJson(this.lastDiagnostic);
    }
    dispose() {
        this.lastDiagnostic = null;
        this.host.dispose();
    }
}
export class BrowserStageOverlayHost {
    canvas;
    document;
    container;
    parent;
    window;
    resizeObserver = null;
    changedParentPosition = false;
    previousParentPosition = '';
    disposed = false;
    constructor(canvas, document = canvas.ownerDocument) {
        this.canvas = canvas;
        this.document = document;
        const parent = canvas.parentElement;
        if (!parent)
            throw new Error('TurboWarp renderer canvas has no parent element.');
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
    showSvg(svg, accessibleText) {
        this.ensureActive();
        const Parser = this.window?.DOMParser ?? globalThis.DOMParser;
        if (!Parser)
            throw new Error('DOMParser is not available.');
        const parsed = new Parser().parseFromString(svg, 'image/svg+xml');
        if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') {
            throw new Error('Generated diagnostic SVG is invalid.');
        }
        const imported = this.document.importNode(parsed.documentElement, true);
        imported.style.width = '100%';
        imported.style.height = '100%';
        imported.style.display = 'block';
        this.container.replaceChildren(imported);
        this.container.setAttribute('aria-label', accessibleText);
        this.updateGeometry();
        this.container.hidden = false;
    }
    clear() {
        if (this.disposed)
            return;
        this.container.hidden = true;
        this.container.removeAttribute('aria-label');
        this.container.replaceChildren();
    }
    isVisible() {
        return !this.disposed && !this.container.hidden;
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        this.window?.removeEventListener('resize', this.updateGeometry);
        this.container.remove();
        if (this.changedParentPosition && this.parent.style.position === 'relative') {
            this.parent.style.position = this.previousParentPosition;
        }
    }
    updateGeometry = () => {
        if (this.disposed)
            return;
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
    ensureActive() {
        if (this.disposed)
            throw new Error('Diagnostic overlay host has been disposed.');
    }
}
//# sourceMappingURL=overlay.js.map