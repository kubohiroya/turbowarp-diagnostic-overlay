import type {SchemaBundle} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import document from '../schemas/block-editor-fixed-inputs.schema.json';

const source = {repository: 'turbowarp-diagnostic-overlay', path: 'schemas/block-editor-fixed-inputs.schema.json',
  symbol: '#/$defs/showDiagnostic/properties/SEVERITY'};

/** The on-disk owner Schema is canonical; this is its single-field projection. */
export const fixedInputSchemaBundle: SchemaBundle = {
  identity: {ownerId: 'turbowarp-diagnostic-overlay', contractId: 'showDiagnostic.SEVERITY', revision: 'fixed-inputs-v1', variantId: 'default'},
  dialect: '2020-12',
  root: {retrievalUri: 'https://kubohiroya.github.io/turbowarp-diagnostic-overlay/schemas/showDiagnostic-SEVERITY.schema.json',
    document: document.$defs.showDiagnostic.properties.SEVERITY, artifact: {role: 'canonical-schema', source}},
  resources: [],
  provenance: {canonicalSources: [source, {repository: 'turbowarp-diagnostic-overlay', path: 'src/extension.ts', symbol: 'severity'}],
    generatedFiles: [{repository: 'turbowarp-diagnostic-overlay', path: 'docs/schemas/block-editor-fixed-inputs.schema.json'}, {repository: 'turbowarp-diagnostic-overlay', path: 'dist/schemas/block-editor-fixed-inputs.schema.json'}], referenceSchemas: [], generationSources: [{repository: 'turbowarp-diagnostic-overlay', path: 'scripts/generate-fixed-input-docs.mjs'}, {repository: 'turbowarp-diagnostic-overlay', path: 'scripts/copy-editor-schema.mjs'}]}
};
