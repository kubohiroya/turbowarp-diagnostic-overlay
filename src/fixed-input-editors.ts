import type {FixedInputEditorOptions} from '@kubohiroya/turbowarp-extension-data-editor';
import {extensionConfig} from './config.js';
import {fixedInputSchemaBundle} from './fixed-input-schema.js';

const choices: readonly string[] = ["info", "warning", "error", "fatal"];

export const fixedInputEditorDefinitions: readonly FixedInputEditorOptions[] = [{
  apiVersion: 1, extensionId: extensionConfig.id, editorId: 'showDiagnostic-fixed-inputs',
  opcodes: [`${extensionConfig.id}_showDiagnostic`],
  contractId: 'turbowarp-diagnostic-overlay:showDiagnostic.SEVERITY', contractRevision: 'fixed-inputs-v1',
  bindings: [{argument: 'SEVERITY', schemaBundle: fixedInputSchemaBundle,
    control: {kind: 'enum', label: 'SEVERITY', choices: [{"value": "info", "label": "info"}, {"value": "warning", "label": "warning"}, {"value": "error", "label": "error"}, {"value": "fatal", "label": "fatal"}]},
    read(value) {
      if (typeof value !== 'string') throw new TypeError('Expected a literal enum value.');
      const normalized = value.trim().toLowerCase();
      return choices.includes(normalized) ? normalized : value;
    },
    encode(value) {
      if (typeof value !== 'string' || !choices.includes(value)) throw new TypeError('Unsupported severity.');
      return value;
    },
    validateCandidate(value) {
      return typeof value === 'string' && choices.includes(value.trim().toLowerCase()) ? []
        : [{path: '/inputs/SEVERITY', message: 'Unsupported diagnostic severity.'}];
    }
  }],
  validationContext: () => ({consumerId: extensionConfig.id, nowMs: Date.now(), settings: null})
}];

interface RuntimeLifetime {
  on?: (event: string, listener: () => void) => void;
  off?: (event: string, listener: () => void) => void;
}

/** Register metadata only; the GUI startup capability owns editor activation. */
export function registerFixedInputEditors(
  scratch: unknown, definitions: readonly FixedInputEditorOptions[], runtimeOverride?: RuntimeLifetime
): () => void {
  const host = scratch as {gui?: {blockEditors?: {apiVersion?: number;
    registerFixedInputEditor?: (options: FixedInputEditorOptions) => () => void}};
    vm?: {runtime?: RuntimeLifetime}};
  const api = host.gui?.blockEditors;
  if (!definitions.length || api?.apiVersion !== 1 || typeof api.registerFixedInputEditor !== 'function') return () => {};
  const runtime = runtimeOverride ?? host.vm?.runtime;
  const removers: (() => void)[] = [];
  let active = true;
  const dispose = () => {
    if (!active) return;
    active = false;
    runtime?.off?.('RUNTIME_DISPOSED', dispose);
    for (const remove of removers.splice(0).reverse()) remove();
  };
  try {
    for (const definition of definitions) {
      const remove = api.registerFixedInputEditor.call(api, definition);
      if (typeof remove !== 'function') throw new TypeError('Invalid fixed input registration disposer.');
      removers.push(remove);
    }
    runtime?.on?.('RUNTIME_DISPOSED', dispose);
  } catch (error) {dispose(); throw error;}
  return dispose;
}
