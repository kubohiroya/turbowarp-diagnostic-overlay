import { createDiagnosticOverlayComposition } from './composition.js';
import { extensionConfig } from './config.js';
if (extensionConfig.unsandboxed && !Scratch.extensions.unsandboxed) {
    throw new Error(`${extensionConfig.name} must run unsandboxed.`);
}
const { extension } = createDiagnosticOverlayComposition(Scratch);
Scratch.extensions.register(extension);
//# sourceMappingURL=index.js.map