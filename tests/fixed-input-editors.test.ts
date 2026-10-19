import {readFileSync} from 'node:fs';
import {DiagnosticOverlayExtension} from '../src/extension.js';
import type {ScratchApi} from '../src/scratch.js';
import type {DiagnosticOverlayController} from '../src/overlay.js';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createFixedInputEditor, EditorRegistry} from '@kubohiroya/turbowarp-extension-data-editor';
import type {BlockEditorHost, FixedBlockSnapshot, FixedInputDraft, JsonObject, JsonValue, LiteralArgumentChange} from '@kubohiroya/turbowarp-extension-data-editor';
import {compileSchemaBundle} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {fixedInputEditorDefinitions, registerFixedInputEditors} from '../src/fixed-input-editors.js';
import {fixedInputSchemaBundle} from '../src/fixed-input-schema.js';

const options = fixedInputEditorDefinitions[0]!;
const argument = 'SEVERITY';
const opening = 'error';
const retainedArguments: Record<string, string> = {"CODE": "  C-keep  ", "MESSAGE": "  keep message\n "};
const replacement = 'fatal';
const definition = () => createFixedInputEditor(options);
afterEach(() => vi.unstubAllGlobals());

function fixture(raw = opening, reporter = false) {
  const registry = new EditorRegistry();
  const remove = registerFixedInputEditors({gui: {blockEditors: {apiVersion: 1,
    registerFixedInputEditor: (value: typeof options) => registry.registerFixed(createFixedInputEditor(value))}}}, fixedInputEditorDefinitions);
  const snapshot: FixedBlockSnapshot = {
    targetId: 'sprite', blockId: 'owner-block', opcode: options.opcodes[0]!, revision: '1',
    arguments: {[argument]: reporter ? {kind: 'reporter'} : {kind: 'literal', value: raw},
      UNBOUND: {kind: 'literal', value: '  untouched source  '},
      ...Object.fromEntries(Object.entries(retainedArguments).map(([name, value]) => [name, {kind: 'literal' as const, value}]))},
    fixedContext: {contractId: options.contractId, contractRevision: options.contractRevision,
      generation: 'generation-1', dependencies: [], readOnlyArguments: [], inputs: {
        [argument]: reporter ? {role: 'editable', source: 'reporter', identity: 'reporter-1'}
          : {role: 'editable', source: 'shadow', identity: 'literal-1',
            field: {blockId: 'literal-block', name: 'SEVERITY', type: 'text'}}
      }}
  };
  const commits: (readonly LiteralArgumentChange[])[] = [];
  const host: BlockEditorHost = {readBlock: () => snapshot, commit: () => {throw new Error('Legacy port was used.');},
    fixedInputs: {capability: 'fixed-inputs-v1', readBlock: () => snapshot, commit: request => {commits.push(request.changes);}}};
  const session = registry.open({targetId: 'sprite', blockId: 'owner-block'}, host)!;
  function edit(value: JsonValue, buffer?: string) {
    const draft = session.getDraft();
    (draft.inputs as JsonObject)[argument] = {value, changed: true, ...(buffer === undefined ? {} : {buffer})};
    session.setDraft(draft);
  }
  return {session, snapshot, commits, remove, edit};
}

describe('fixed input owner contract', () => {
  it('compiles the on-disk canonical field and registers exactly the planned argument', () => {
    expect(compileSchemaBundle(fixedInputSchemaBundle).kind).toBe('compiled');
    expect(definition().editableArguments).toEqual([argument]);
    expect(definition().readOnlyArguments).toEqual([]);
    expect(definition().opcodes).toEqual(options.opcodes);
    expect(fixedInputSchemaBundle.root.artifact.role).toBe('canonical-schema');
    expect(fixedInputSchemaBundle.provenance.canonicalSources[0]!.symbol).toContain(`/properties/${argument}`);
  });
  it('keeps no-op raw and unrelated arguments without a patch', async () => {
    const f = fixture();
    expect(await f.session.save()).toEqual({status: 'saved', changed: false});
    expect(f.commits).toEqual([]);
    expect(f.snapshot.arguments.UNBOUND).toEqual({kind: 'literal', value: '  untouched source  '});
    for (const [name, value] of Object.entries(retainedArguments)) expect(f.snapshot.arguments[name]).toEqual({kind: 'literal', value});
    f.remove();
  });
  it('commits only the explicitly selected literal through the fixed port', async () => {
    const f = fixture();
    f.edit(replacement);
    expect(await f.session.save()).toEqual({status: 'saved', changed: true});
    expect(f.commits).toEqual([[{argument, value: replacement}]]);
    expect(f.snapshot.arguments.UNBOUND).toEqual({kind: 'literal', value: '  untouched source  '});
    for (const [name, value] of Object.entries(retainedArguments)) expect(f.snapshot.arguments[name]).toEqual({kind: 'literal', value});
    f.remove();
  });
  it('rejects invalid changed values without a patch and retains the dialog draft', async () => {
    const f = fixture();
    f.edit('unknown-value');
    expect((await f.session.save()).status).toBe('invalid');
    expect(f.commits).toEqual([]);
    expect((f.session.getDraft() as FixedInputDraft).inputs[argument]).toMatchObject({changed: true});
    f.remove();
  });
  it('never evaluates or replaces a reporter-backed input', async () => {
    const f = fixture(opening, true);
    expect((f.session.getDraft() as FixedInputDraft).inputs[argument]).toEqual({readOnly: true});
    expect(f.session.getFixedInputView()!.inputs[argument]!.state).toBe('readonly');
    expect(await f.session.save()).toEqual({status: 'saved', changed: false});
    expect(f.commits).toEqual([]);f.remove();
  });
  it('fails closed for a forged reporter edit', async () => {
    const f = fixture(opening, true);f.edit(replacement);
    expect((await f.session.save()).status).toBe('invalid');expect(f.commits).toEqual([]);f.remove();
  });
  it('keeps optional capability absent or version mismatch inactive', () => {
    expect(() => registerFixedInputEditors({}, fixedInputEditorDefinitions)()).not.toThrow();
    const register = vi.fn();
    registerFixedInputEditors({gui: {blockEditors: {apiVersion: 2, registerFixedInputEditor: register}}}, fixedInputEditorDefinitions)();
    expect(register).not.toHaveBeenCalled();
  });
  it('unregisters once on runtime disposal and permits later re-registration', () => {
    const listeners = new Map<string, () => void>();const unregister = vi.fn();
    const scratch = {gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor: vi.fn(() => unregister)}},
      vm: {runtime: {on: (event: string, fn: () => void) => listeners.set(event, fn),
        off: (event: string) => listeners.delete(event)}}};
    const dispose = registerFixedInputEditors(scratch, fixedInputEditorDefinitions);
    listeners.get('RUNTIME_DISPOSED')!();dispose();expect(unregister).toHaveBeenCalledTimes(1);expect(listeners.size).toBe(0);
    registerFixedInputEditors(scratch, fixedInputEditorDefinitions)();expect(unregister).toHaveBeenCalledTimes(2);
  });
  it('releases prior registrations if a later registration fails', () => {
    const unregister = vi.fn();let calls = 0;
    expect(() => registerFixedInputEditors({gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor: () => {
      if (++calls === 2) throw new Error('registration failed');return unregister;
    }}}}, [options, options])).toThrow('registration failed');
    expect(unregister).toHaveBeenCalledTimes(1);
  });
  it('does not register inactive owner definitions or attach lifecycle listeners', () => {
    const register = vi.fn();const on = vi.fn();
    registerFixedInputEditors({gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor: register}}, vm: {runtime: {on}}}, [])();
    expect(register).not.toHaveBeenCalled();expect(on).not.toHaveBeenCalled();
  });
  it('does not execute owner codecs while registering static metadata', () => {
    const binding = options.bindings[0]!;const read = vi.fn(binding.read);const encode = vi.fn(binding.encode);const validate = vi.fn(binding.validateCandidate);
    registerFixedInputEditors({gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor: () => () => {}}}},
      [{...options, bindings: [{...binding, read, encode, validateCandidate: validate}]}])();
    expect(read).not.toHaveBeenCalled();expect(encode).not.toHaveBeenCalled();expect(validate).not.toHaveBeenCalled();
  });
});

describe('enum compatibility', () => {
  it('keeps unknown raw for repair without selecting the first item', async () => {
    const f = fixture('future-enum');
    expect((f.session.getDraft() as FixedInputDraft).inputs[argument]).toMatchObject({value: 'future-enum', changed: false});
    expect(await f.session.save()).toEqual({status: 'saved', changed: false});expect(f.commits).toEqual([]);f.remove();
  });
  it('repairs unknown raw only by an explicit canonical choice', async () => {
    const f = fixture('future-enum');f.edit(replacement);
    expect(await f.session.save()).toEqual({status: 'saved', changed: true});expect(f.commits).toEqual([[{argument, value: replacement}]]);f.remove();
  });
});

function diagnosticOwner(config: {failFixed?: boolean; failEvent?: string; sourceRemove?: () => void; fixedRemove?: () => void} = {}) {
  const registered: typeof options[] = [];
  const removals = vi.fn();const show = vi.fn();
  const listeners = new Map<string, Set<() => void>>();
  const runtime = {on: (event: string, fn: () => void) => {
    if (!listeners.has(event)) listeners.set(event, new Set());listeners.get(event)!.add(fn);
    if (event === config.failEvent) throw new Error('later constructor failure');
  }, off: (event: string, fn: () => void) => listeners.get(event)?.delete(fn)};
  const scratch = {gui: {blockEditors: {apiVersion: 1, registerSourceEditor() {return config.sourceRemove ?? (() => {});}, registerFixedInputEditor(value: typeof options) {
      if (config.failFixed) throw new Error('fixed registration failure');registered.push(value);return config.fixedRemove ?? removals;}}},
    vm: {runtime}, BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'}, ArgumentType: {STRING: 'string'},
    Cast: {toString: (value: unknown) => String(value ?? '')}, translate: (value: string) => value};
  const controller = {show, clear: vi.fn(), dispose: vi.fn()} as unknown as DiagnosticOverlayController;
  const extension = new DiagnosticOverlayExtension(scratch as unknown as ScratchApi, controller);
  return {extension, registered, removals, show, listeners};
}
describe('real Diagnostic owner metadata and parity', () => {
  it('registers metadata once without displaying a diagnostic or changing getInfo', () => {
    const f = diagnosticOwner();const before = f.extension.getInfo();expect(f.extension.getInfo()).toEqual(before);
    expect(f.registered).toEqual(fixedInputEditorDefinitions);expect(f.show).not.toHaveBeenCalled();
    expect((before.menus as {severityMenu: {acceptReporters: boolean; items: string[]}}).severityMenu)
      .toEqual({acceptReporters: true, items: ['info', 'warning', 'error', 'fatal']});
    for (const callback of [...f.listeners.get('RUNTIME_DISPOSED')!]) callback();
    f.extension.dispose();expect(f.removals).toHaveBeenCalledTimes(1);
  });
  it.each(['info', 'warning', 'error', 'fatal', ' ERROR ', 'FaTaL'])('matches the unchanged runtime normalization for %s and keeps raw', async raw => {
    const owner = diagnosticOwner();owner.extension.showDiagnostic({SEVERITY: raw, CODE: 'keep', MESSAGE: 'same'});
    const f = fixture(raw);const projected = (f.session.getDraft() as FixedInputDraft).inputs[argument];
    expect(projected).toMatchObject({value: raw.trim().toLowerCase(), changed: false});
    expect(owner.show.mock.calls[0]![0]).toMatchObject({severity: raw.trim().toLowerCase()});
    expect(await f.session.save()).toEqual({status: 'saved', changed: false});expect(f.commits).toEqual([]);f.remove();owner.extension.dispose();
  });
});

it('rejects duplicate registrations without removing the first owner registration', () => {
  const registry = new EditorRegistry();
  const scratch = {gui: {blockEditors: {apiVersion: 1,
    registerFixedInputEditor: (value: typeof options) => registry.registerFixed(createFixedInputEditor(value))}}};
  const dispose = registerFixedInputEditors(scratch, fixedInputEditorDefinitions);
  expect(() => registerFixedInputEditors(scratch, fixedInputEditorDefinitions)).toThrow();
  expect(registry.resolveFixed(options.opcodes[0]!)).toMatchObject({contractId: options.contractId});
  dispose();expect(registry.resolveFixed(options.opcodes[0]!)).toBeUndefined();
});

it('rolls back existing SOURCE when fixed registration fails in the real constructor', () => {
  const sourceRemove = vi.fn();expect(() => diagnosticOwner({sourceRemove, failFixed: true})).toThrow('fixed registration failure');
  expect(sourceRemove).toHaveBeenCalledTimes(1);
});
it('rolls back SOURCE and fixed registration on a later constructor failure', () => {
  const sourceRemove = vi.fn();const fixedRemove = vi.fn();
  expect(() => diagnosticOwner({sourceRemove, fixedRemove, failEvent: 'PROJECT_LOADED'})).toThrow('later constructor failure');
  expect(sourceRemove).toHaveBeenCalledTimes(1);expect(fixedRemove).toHaveBeenCalledTimes(1);
});

it('keeps the docsURI landing-page block anchor linked to generated fixed-form help and the canonical Schema copy', () => {
  const html = readFileSync('docs/index.html', 'utf8');
  expect(html).toContain('href="#block-showDiagnostic"');
  const article = html.match(/<article id="block-showDiagnostic"[^>]*>[\s\S]*?<\/article>/)![0];
  expect(article).toContain('id="fixed-input-showDiagnostic-SEVERITY"');expect(article).toContain('FixedInputs');expect(article).toContain('SEVERITY');
  expect(readFileSync('docs/schemas/block-editor-fixed-inputs.schema.json', 'utf8'))
    .toBe(readFileSync('schemas/block-editor-fixed-inputs.schema.json', 'utf8'));
});
