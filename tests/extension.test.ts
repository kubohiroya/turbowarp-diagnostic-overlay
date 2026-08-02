import {describe, expect, it, vi} from 'vitest';
import {createDiagnosticOverlayComposition} from '../src/composition.js';
import {DiagnosticOverlayExtension} from '../src/extension.js';
import {DiagnosticOverlayController} from '../src/overlay.js';
import type {DiagnosticOverlayHost} from '../src/overlay.js';
import type {ScratchApi} from '../src/scratch.js';

describe('DiagnosticOverlayExtension', () => {
  it('exposes stable block metadata and severity menu', () => {
    const {extension} = setup();
    const info = extension.getInfo() as {
      id: string;
      blocks: Array<{opcode: string}>;
      menus: {severityMenu: {items: string[]}};
    };

    expect(info.id).toBe('kubohiroyadiagnosticoverlay');
    expect(info.blocks.map((block) => block.opcode)).toEqual([
      'showDiagnostic',
      'showDiagnosticJson',
      'clearDiagnosticOverlay',
      'diagnosticOverlayVisible',
      'diagnosticSvg',
      'lastDiagnosticJson'
    ]);
    expect(info.menus.severityMenu.items).toEqual(['info', 'warning', 'error', 'fatal']);
  });

  it('displays simple and JSON diagnostics and reports state', () => {
    const {extension, host} = setup();
    extension.showDiagnostic({SEVERITY: 'warning', CODE: 'W1', MESSAGE: 'Check this'});
    expect(extension.diagnosticOverlayVisible()).toBe(true);
    expect(extension.lastDiagnosticJson()).toBe(
      '{"severity":"warning","code":"W1","message":"Check this"}'
    );

    extension.showDiagnosticJson({
      DIAGNOSTIC: '{"severity":"fatal","code":"F1","message":"Stop","source":{"line":4}}'
    });
    expect(host.svg).toContain('FATAL  F1');
    expect(extension.diagnosticSvg({
      DIAGNOSTIC: '{"severity":"info","code":"I1","message":"Preview"}'
    })).toContain('INFO  I1');

    extension.clearDiagnosticOverlay();
    expect(extension.diagnosticOverlayVisible()).toBe(false);
  });

  it('clears on project replacement and releases listeners on runtime disposal', () => {
    const {extension, host, listeners, off} = setup();
    extension.showDiagnostic({SEVERITY: 'error', CODE: 'E1', MESSAGE: 'Visible'});
    listeners.get('PROJECT_LOADED')?.();
    expect(host.visible).toBe(false);

    listeners.get('RUNTIME_DISPOSED')?.();
    expect(host.disposed).toBe(true);
    expect(off).toHaveBeenCalledTimes(2);
    extension.dispose();
    expect(off).toHaveBeenCalledTimes(2);
  });

  it('rejects unsupported severities', () => {
    const {extension} = setup();
    expect(() => extension.showDiagnostic({SEVERITY: 'debug', CODE: 'D1', MESSAGE: 'No'})).toThrowError(
      'Unsupported diagnostic severity'
    );
  });
});

describe('composition API', () => {
  it('constructs an extension without registering it or reading a global Scratch object', () => {
    const {scratch} = createScratch();
    const host = new FakeHost();
    const composition = createDiagnosticOverlayComposition(scratch, {host});

    expect(composition.extension).toBeInstanceOf(DiagnosticOverlayExtension);
    expect(scratch.extensions.register).not.toHaveBeenCalled();
    composition.controller.show({severity: 'info', code: 'C1', message: 'Composed'});
    expect(host.svg).toContain('INFO  C1');
  });
});

function setup(): {
  extension: DiagnosticOverlayExtension;
  host: FakeHost;
  listeners: Map<string, () => void>;
  off: ReturnType<typeof vi.fn>;
} {
  const {scratch, listeners, off} = createScratch();
  const host = new FakeHost();
  const controller = new DiagnosticOverlayController(host);
  return {extension: new DiagnosticOverlayExtension(scratch, controller), host, listeners, off};
}

function createScratch(): {
  scratch: ScratchApi;
  listeners: Map<string, () => void>;
  off: ReturnType<typeof vi.fn>;
} {
  const listeners = new Map<string, () => void>();
  const off = vi.fn((eventName: string) => listeners.delete(eventName));
  const scratch: ScratchApi = {
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'},
    ArgumentType: {STRING: 'string'},
    Cast: {toString: (value: unknown) => String(value ?? '')},
    translate: (value: string | {default: string}) => typeof value === 'string' ? value : value.default,
    vm: {
      runtime: {
        renderer: {canvas: document.createElement('canvas')},
        stageWidth: 480,
        stageHeight: 360,
        on: (eventName, listener) => listeners.set(eventName, listener),
        off
      }
    }
  };
  return {scratch, listeners, off};
}

class FakeHost implements DiagnosticOverlayHost {
  public svg = '';
  public visible = false;
  public disposed = false;

  public showSvg(svg: string): void {
    this.svg = svg;
    this.visible = true;
  }

  public clear(): void {
    this.visible = false;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public dispose(): void {
    this.disposed = true;
    this.visible = false;
  }
}
