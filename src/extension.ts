import {fixedInputEditorDefinitions, registerFixedInputEditors} from './fixed-input-editors.js';
import {sourceEditorDefinitions} from './editor-schema.js';
import {registerSourceEditors} from './source-editor.js';
import definitions from './block-definitions.json' with {type: 'json'};
import {extensionConfig} from './config.js';
import {parseDiagnosticJson} from './diagnostic.js';
import type {Diagnostic, DiagnosticSeverity} from './diagnostic.js';
import type {DiagnosticOverlayController} from './overlay.js';
import type {ScratchApi, TurboWarpRuntime} from './scratch.js';

type BlockTypeName = 'COMMAND' | 'REPORTER' | 'BOOLEAN';
type ArgumentTypeName = 'STRING';
type BlockArguments = Record<string, unknown>;

interface DefinitionArgument {
  type: ArgumentTypeName;
  defaultValue: string;
  menu?: string;
}

interface DefinitionBlock {
  opcode: string;
  blockType: BlockTypeName;
  text: string;
  description: string;
  disableMonitor?: boolean;
  arguments: Record<string, DefinitionArgument>;
}

const blockDefinitions = definitions.blocks as readonly DefinitionBlock[];

export class DiagnosticOverlayExtension {
  private readonly runtime: TurboWarpRuntime;
  private disposed = false;
  private controllerDisposed = false;
  private unregisterSourceEditors: () => void;
  private unregisterFixedInputEditors: () => void;
  /**
   * Loading a project disposes the runtime, which releases the editor registrations, but the
   * extension stays loaded for the next project. Register them again once that project has loaded.
   */
  private editorsReleased = false;

  public constructor(
    private readonly scratch: ScratchApi,
    private readonly controller: DiagnosticOverlayController
  ) {
    this.runtime = scratch.vm.runtime;
    this.unregisterSourceEditors = registerSourceEditors(scratch, sourceEditorDefinitions);
    let unregisterFixed = () => {};
    try {
      unregisterFixed = registerFixedInputEditors(scratch, fixedInputEditorDefinitions);
      this.unregisterFixedInputEditors = unregisterFixed;
      this.runtime.on?.('PROJECT_LOADED', this.handleProjectLoaded);
      this.runtime.on?.('RUNTIME_DISPOSED', this.handleRuntimeDisposed);
    } catch (error) {
      this.runtime.off?.('PROJECT_LOADED', this.handleProjectLoaded);
      this.runtime.off?.('RUNTIME_DISPOSED', this.handleRuntimeDisposed);
      unregisterFixed();
      this.unregisterSourceEditors();
      throw error;
    }
  }

  public getInfo(): Record<string, unknown> {
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

  public showDiagnostic(args: BlockArguments): void {
    const diagnostic: Diagnostic = {
      severity: this.severity(args.SEVERITY),
      code: this.string(args.CODE),
      message: this.string(args.MESSAGE)
    };
    this.controller.show(diagnostic);
  }

  public showDiagnosticJson(args: BlockArguments): void {
    this.controller.show(parseDiagnosticJson(this.string(args.DIAGNOSTIC)));
  }

  public clearDiagnosticOverlay(): void {
    this.controller.clear();
  }

  public diagnosticOverlayVisible(): boolean {
    return this.controller.isVisible();
  }

  public diagnosticSvg(args: BlockArguments): string {
    return this.controller.render(parseDiagnosticJson(this.string(args.DIAGNOSTIC)));
  }

  public lastDiagnosticJson(): string {
    return this.controller.lastDiagnosticJson();
  }

  /** Final disposal by the owner: nothing registers again after it. */
  public readonly dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.runtime.off?.('PROJECT_LOADED', this.handleProjectLoaded);
    this.runtime.off?.('RUNTIME_DISPOSED', this.handleRuntimeDisposed);
    this.editorsReleased = false;
    this.unregisterEditors();
    this.disposeController();
  };

  /** Every project load disposes the runtime; only the editor registrations come back after it. */
  private readonly handleRuntimeDisposed = (): void => {
    this.unregisterEditors();
    this.editorsReleased = true;
    this.disposeController();
  };

  private readonly handleProjectLoaded = (): void => {
    if (this.editorsReleased) {
      this.editorsReleased = false;
      this.unregisterSourceEditors = registerSourceEditors(this.scratch, sourceEditorDefinitions);
      try {
        this.unregisterFixedInputEditors = registerFixedInputEditors(this.scratch, fixedInputEditorDefinitions);
      } catch (error) {
        this.unregisterEditors();
        this.editorsReleased = true;
        throw error;
      }
    }
    if (!this.controllerDisposed) this.controller.clear();
  };

  private unregisterEditors(): void {
    this.unregisterFixedInputEditors();
    this.unregisterSourceEditors();
  }

  private disposeController(): void {
    if (this.controllerDisposed) return;
    this.controllerDisposed = true;
    this.controller.dispose();
  }

  private toScratchBlock(block: DefinitionBlock): Record<string, unknown> {
    return {
      opcode: block.opcode,
      blockType: this.scratch.BlockType[block.blockType],
      text: this.scratch.translate(block.text),
      ...(block.disableMonitor ? {disableMonitor: true} : {}),
      arguments: Object.fromEntries(
        Object.entries(block.arguments).map(([name, argument]) => [
          name,
          {
            type: this.scratch.ArgumentType[argument.type],
            defaultValue: argument.defaultValue,
            ...(argument.menu ? {menu: argument.menu} : {})
          }
        ])
      )
    };
  }

  private string(value: unknown): string {
    return this.scratch.Cast.toString(value);
  }

  private severity(value: unknown): DiagnosticSeverity {
    const severity = this.string(value).trim().toLowerCase();
    if (severity === 'info' || severity === 'warning' || severity === 'error' || severity === 'fatal') {
      return severity;
    }
    throw new Error(`Unsupported diagnostic severity: ${severity}`);
  }
}
