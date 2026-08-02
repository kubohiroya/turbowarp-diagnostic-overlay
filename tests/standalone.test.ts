import {afterEach, describe, expect, it, vi} from 'vitest';
import type {ScratchApi} from '../src/scratch.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  document.body.replaceChildren();
});

describe('standalone entry point', () => {
  it('registers exactly one unsandboxed extension', async () => {
    const parent = document.createElement('div');
    const canvas = document.createElement('canvas');
    parent.append(canvas);
    document.body.append(parent);
    const register = vi.fn();
    const scratch: ScratchApi = {
      extensions: {unsandboxed: true, register},
      BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'},
      ArgumentType: {STRING: 'string'},
      Cast: {toString: (value: unknown) => String(value ?? '')},
      translate: (value: string | {default: string}) => typeof value === 'string' ? value : value.default,
      vm: {runtime: {renderer: {canvas}}}
    };
    vi.stubGlobal('Scratch', scratch);

    await import('../src/index.js');

    expect(register).toHaveBeenCalledTimes(1);
    const extension = register.mock.calls[0]?.[0] as {getInfo(): {id: string}; dispose(): void};
    expect(extension.getInfo().id).toBe('kubohiroyadiagnosticoverlay');
    extension.dispose();
  });
});
