import {afterEach, describe, expect, it, vi} from 'vitest';
import {BrowserStageOverlayHost, DiagnosticOverlayController} from '../src/overlay.js';
import type {DiagnosticOverlayHost} from '../src/overlay.js';

afterEach(() => {
  document.body.replaceChildren();
});

describe('BrowserStageOverlayHost', () => {
  it('shows a non-interactive SVG over the canvas and restores the host on dispose', () => {
    const parent = document.createElement('div');
    const canvas = document.createElement('canvas');
    parent.append(canvas);
    document.body.append(parent);
    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue(rect(10, 20, 500, 400));
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(rect(20, 30, 480, 360));

    const host = new BrowserStageOverlayHost(canvas);
    host.showSvg('<svg xmlns="http://www.w3.org/2000/svg"><text>safe</text></svg>', 'error E1');

    const overlay = parent.querySelector<HTMLElement>('[data-turbowarp-diagnostic-overlay]');
    expect(overlay).not.toBeNull();
    expect(overlay?.hidden).toBe(false);
    expect(overlay?.style.pointerEvents).toBe('none');
    expect(overlay?.style.left).toBe('10px');
    expect(overlay?.style.top).toBe('10px');
    expect(overlay?.style.width).toBe('480px');
    expect(overlay?.getAttribute('aria-label')).toBe('error E1');
    expect(overlay?.querySelector('svg')).not.toBeNull();
    expect(parent.style.position).toBe('relative');

    host.clear();
    expect(host.isVisible()).toBe(false);
    expect(overlay?.childElementCount).toBe(0);

    host.dispose();
    expect(parent.querySelector('[data-turbowarp-diagnostic-overlay]')).toBeNull();
    expect(parent.style.position).toBe('');
  });

  it('rejects invalid SVG and calls dispose idempotently', () => {
    const parent = document.createElement('div');
    const canvas = document.createElement('canvas');
    parent.append(canvas);
    document.body.append(parent);
    const host = new BrowserStageOverlayHost(canvas);

    expect(() => host.showSvg('<svg><', 'bad')).toThrowError('invalid');
    host.dispose();
    host.dispose();
    expect(() => host.showSvg('<svg xmlns="http://www.w3.org/2000/svg"/>', 'late')).toThrowError(
      'disposed'
    );
  });
});

describe('DiagnosticOverlayController', () => {
  it('owns display state but does not stop an external runtime', () => {
    const host = new FakeHost();
    const controller = new DiagnosticOverlayController(host);

    const svg = controller.show({severity: 'info', code: 'I1', message: 'Ready'});
    expect(host.svg).toBe(svg);
    expect(host.accessibleText).toContain('INFO. I1. Ready');
    expect(controller.isVisible()).toBe(true);
    expect(controller.lastDiagnosticJson()).toBe(
      '{"severity":"info","code":"I1","message":"Ready"}'
    );

    controller.clear();
    expect(controller.lastDiagnosticJson()).toBe('');
    controller.dispose();
    expect(host.disposed).toBe(true);
  });
});

class FakeHost implements DiagnosticOverlayHost {
  public svg = '';
  public accessibleText = '';
  public visible = false;
  public disposed = false;

  public showSvg(svg: string, accessibleText: string): void {
    this.svg = svg;
    this.accessibleText = accessibleText;
    this.visible = true;
  }

  public clear(): void {
    this.visible = false;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public dispose(): void {
    this.visible = false;
    this.disposed = true;
  }
}

function rect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON: () => ({})
  } as DOMRect;
}
