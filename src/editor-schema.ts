import type {SourceEditorOptions} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {extensionConfig} from './config.js';
import {canonicalBundle, sourceBinding} from './source-editor.js';
import document from '../schemas/diagnostic.schema.json' with {type: 'json'};
import {parseDiagnosticJson} from './diagnostic.js';
export const diagnosticSchemaBundle = canonicalBundle('turbowarp-diagnostic-overlay', 'diagnostic', document, {path: 'src/diagnostic.ts', symbol: 'parseDiagnosticJson'});
const definitions = [{editorId: 'diagnostic-source', opcodes: ['showDiagnosticJson', 'diagnosticSvg'],
  bindings: [sourceBinding('DIAGNOSTIC', diagnosticSchemaBundle, JSON.parse, parseDiagnosticJson, 'json',
    {severity: {'ui:enum': ['info', 'warning', 'error', 'fatal']}})]}];

export const sourceEditorDefinitions: readonly SourceEditorOptions[] = definitions.map(({editorId, opcodes, bindings}) => ({
  apiVersion: 1, extensionId: extensionConfig.id, editorId, opcodes: opcodes.map(opcode => `${extensionConfig.id}_${opcode}`), bindings,
  validationContext: () => ({consumerId: extensionConfig.id, nowMs: Date.now(), settings: null})
}));
