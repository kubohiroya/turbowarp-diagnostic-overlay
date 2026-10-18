import { compileSchemaBundle, validateSchemaInput } from '@kubohiroya/turbowarp-extension-data-editor/schema';
export function canonicalBundle(ownerId, contractId, document, ownerSource) {
    const path = `schemas/${contractId}.schema.json`;
    const source = { repository: ownerId, path };
    return {
        identity: { ownerId, contractId, revision: 'source-forms-v1', variantId: 'default' },
        dialect: '2020-12',
        root: { retrievalUri: `https://kubohiroya.github.io/${ownerId}/schemas/${contractId}.schema.json`, document,
            artifact: { role: 'canonical-schema', source } },
        resources: [], provenance: { canonicalSources: [source, { repository: ownerId, ...ownerSource }], generatedFiles: [], referenceSchemas: [], generationSources: [] }
    };
}
export function sourceBinding(argument, bundle, read, check = read, format = 'json', uiSchema) {
    const compiled = compileSchemaBundle(bundle);
    return {
        argument,
        variants: [{ variantId: 'default', format, schemaBundle: bundle, ...(uiSchema ? { uiSchema } : {}) }],
        decode(source) { return { source, format, variantId: 'default', data: read(source) }; },
        validateSource(source, context) {
            if (compiled.kind !== 'compiled')
                return { source, result: { kind: 'schema-error', diagnostics: [{ code: 'source-schema-invalid' }] } };
            try {
                const data = read(source);
                return { source, result: validateSchemaInput(compiled.validator, data, { context,
                        ownerValidate: () => {
                            try {
                                check(source);
                                return { kind: 'valid', issues: [] };
                            }
                            catch {
                                return { kind: 'invalid', issues: [{ dataPath: '', ruleId: 'source-owner-invalid' }] };
                            }
                        } }) };
            }
            catch {
                return { source, result: { kind: 'invalid', diagnostics: [{ code: 'source-decode-invalid' }] } };
            }
        }
    };
}
/** The optional capability keeps legacy hosts and the startup flag safely inactive. */
export function registerSourceEditors(scratch, definitions) {
    const host = scratch;
    const api = host.gui?.blockEditors;
    if (api?.apiVersion !== 1 || typeof api.registerSourceEditor !== 'function')
        return () => { };
    const removers = [];
    let active = true;
    const dispose = () => {
        if (!active)
            return;
        active = false;
        host.vm?.runtime?.off?.('RUNTIME_DISPOSED', dispose);
        for (const remove of removers.splice(0).reverse())
            remove();
    };
    try {
        for (const definition of definitions)
            removers.push(api.registerSourceEditor.call(api, definition));
        host.vm?.runtime?.on?.('RUNTIME_DISPOSED', dispose);
    }
    catch (error) {
        dispose();
        throw error;
    }
    return dispose;
}
//# sourceMappingURL=source-editor.js.map