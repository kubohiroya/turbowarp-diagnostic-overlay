import { fixedInputEditorDefinitions, registerFixedInputEditors } from './fixed-input-editors.js';
import { sourceEditorDefinitions } from './editor-schema.js';
import { registerSourceEditors } from './source-editor.js';
import definitions from './block-definitions.json' with { type: 'json' };
import { extensionConfig } from './config.js';
import { parseDiagnosticJson } from './diagnostic.js';
const blockDefinitions = definitions.blocks;
export class DiagnosticOverlayExtension {
    scratch;
    controller;
    runtime;
    disposed = false;
    controllerDisposed = false;
    unregisterSourceEditors;
    unregisterFixedInputEditors;
    /**
     * Loading a project disposes the runtime, which releases the editor registrations, but the
     * extension stays loaded for the next project. Register them again once that project has loaded.
     */
    editorsReleased = false;
    constructor(scratch, controller) {
        this.scratch = scratch;
        this.controller = controller;
        this.runtime = scratch.vm.runtime;
        this.unregisterSourceEditors = registerSourceEditors(scratch, sourceEditorDefinitions);
        let unregisterFixed = () => { };
        try {
            unregisterFixed = registerFixedInputEditors(scratch, fixedInputEditorDefinitions);
            this.unregisterFixedInputEditors = unregisterFixed;
            this.runtime.on?.('PROJECT_LOADED', this.handleProjectLoaded);
            this.runtime.on?.('RUNTIME_DISPOSED', this.handleRuntimeDisposed);
        }
        catch (error) {
            this.runtime.off?.('PROJECT_LOADED', this.handleProjectLoaded);
            this.runtime.off?.('RUNTIME_DISPOSED', this.handleRuntimeDisposed);
            unregisterFixed();
            this.unregisterSourceEditors();
            throw error;
        }
    }
    getInfo() {
        return {
            id: extensionConfig.id,
            blockIconURI: extensionConfig.blockIconURI,
            docsURI: 'https://kubohiroya.github.io/turbowarp-diagnostic-overlay/',
            name: this.scratch.translate(definitions.extensionName),
            color1: '#C44747',
            color2: '#A83B3B',
            color3: '#8C3030',
            blocks: blockDefinitions.map((block) => this.toScratchBlock(block)),
            menus: {
                severityMenu: {
                    acceptReporters: true,
                    items: ['info', 'warning', 'error', 'fatal']
                }
            }
        };
    }
    showDiagnostic(args) {
        const diagnostic = {
            severity: this.severity(args.SEVERITY),
            code: this.string(args.CODE),
            message: this.string(args.MESSAGE)
        };
        this.controller.show(diagnostic);
    }
    showDiagnosticJson(args) {
        this.controller.show(parseDiagnosticJson(this.string(args.DIAGNOSTIC)));
    }
    clearDiagnosticOverlay() {
        this.controller.clear();
    }
    diagnosticOverlayVisible() {
        return this.controller.isVisible();
    }
    diagnosticSvg(args) {
        return this.controller.render(parseDiagnosticJson(this.string(args.DIAGNOSTIC)));
    }
    lastDiagnosticJson() {
        return this.controller.lastDiagnosticJson();
    }
    /** Final disposal by the owner: nothing registers again after it. */
    dispose = () => {
        if (this.disposed)
            return;
        this.disposed = true;
        this.runtime.off?.('PROJECT_LOADED', this.handleProjectLoaded);
        this.runtime.off?.('RUNTIME_DISPOSED', this.handleRuntimeDisposed);
        this.editorsReleased = false;
        this.unregisterEditors();
        this.disposeController();
    };
    /** Every project load disposes the runtime; only the editor registrations come back after it. */
    handleRuntimeDisposed = () => {
        this.unregisterEditors();
        this.editorsReleased = true;
        this.disposeController();
    };
    handleProjectLoaded = () => {
        if (this.editorsReleased) {
            this.editorsReleased = false;
            this.unregisterSourceEditors = registerSourceEditors(this.scratch, sourceEditorDefinitions);
            try {
                this.unregisterFixedInputEditors = registerFixedInputEditors(this.scratch, fixedInputEditorDefinitions);
            }
            catch (error) {
                this.unregisterEditors();
                this.editorsReleased = true;
                throw error;
            }
        }
        if (!this.controllerDisposed)
            this.controller.clear();
    };
    unregisterEditors() {
        this.unregisterFixedInputEditors();
        this.unregisterSourceEditors();
    }
    disposeController() {
        if (this.controllerDisposed)
            return;
        this.controllerDisposed = true;
        this.controller.dispose();
    }
    toScratchBlock(block) {
        return {
            opcode: block.opcode,
            blockType: this.scratch.BlockType[block.blockType],
            text: this.scratch.translate(block.text),
            ...(block.disableMonitor ? { disableMonitor: true } : {}),
            arguments: Object.fromEntries(Object.entries(block.arguments).map(([name, argument]) => [
                name,
                {
                    type: this.scratch.ArgumentType[argument.type],
                    defaultValue: argument.defaultValue,
                    ...(argument.menu ? { menu: argument.menu } : {})
                }
            ]))
        };
    }
    string(value) {
        return this.scratch.Cast.toString(value);
    }
    severity(value) {
        const severity = this.string(value).trim().toLowerCase();
        if (severity === 'info' || severity === 'warning' || severity === 'error' || severity === 'fatal') {
            return severity;
        }
        throw new Error(`Unsupported diagnostic severity: ${severity}`);
    }
}
//# sourceMappingURL=extension.js.map