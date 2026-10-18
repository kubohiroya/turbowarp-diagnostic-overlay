import type { SchemaBundle, SchemaDocument, SourceBinding, SourceEditorOptions } from '@kubohiroya/turbowarp-extension-data-editor/schema';
export declare function canonicalBundle(ownerId: string, contractId: string, document: SchemaDocument, ownerSource: {
    path: string;
    symbol: string;
}): SchemaBundle;
export declare function sourceBinding(argument: string, bundle: SchemaBundle, read: (source: string) => unknown, check?: (source: string) => unknown, format?: 'json' | 'yaml', uiSchema?: SourceBinding['variants'][number]['uiSchema']): SourceBinding;
/** The optional capability keeps legacy hosts and the startup flag safely inactive. */
export declare function registerSourceEditors(scratch: unknown, definitions: readonly SourceEditorOptions[]): () => void;
//# sourceMappingURL=source-editor.d.ts.map