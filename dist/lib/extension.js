import definitions from './block-definitions.json' with { type: 'json' };
import { extensionConfig } from './config.js';
import { parseDiagnosticJson } from './diagnostic.js';
const blockDefinitions = definitions.blocks;
export class DiagnosticOverlayExtension {
    scratch;
    controller;
    runtime;
    disposed = false;
    constructor(scratch, controller) {
        this.scratch = scratch;
        this.controller = controller;
        this.runtime = scratch.vm.runtime;
        this.runtime.on?.('PROJECT_LOADED', this.clearOnProjectLoad);
        this.runtime.on?.('RUNTIME_DISPOSED', this.dispose);
    }
    getInfo() {
        return {
            id: extensionConfig.id,
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
    dispose = () => {
        if (this.disposed)
            return;
        this.disposed = true;
        this.runtime.off?.('PROJECT_LOADED', this.clearOnProjectLoad);
        this.runtime.off?.('RUNTIME_DISPOSED', this.dispose);
        this.controller.dispose();
    };
    clearOnProjectLoad = () => {
        this.controller.clear();
    };
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