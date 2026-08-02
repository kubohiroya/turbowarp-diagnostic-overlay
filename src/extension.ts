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

  public constructor(
    private readonly scratch: ScratchApi,
    private readonly controller: DiagnosticOverlayController
  ) {
    this.runtime = scratch.vm.runtime;
    this.runtime.on?.('PROJECT_LOADED', this.clearOnProjectLoad);
    this.runtime.on?.('RUNTIME_DISPOSED', this.dispose);
  }

  public getInfo(): Record<string, unknown> {
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

  public readonly dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.runtime.off?.('PROJECT_LOADED', this.clearOnProjectLoad);
    this.runtime.off?.('RUNTIME_DISPOSED', this.dispose);
    this.controller.dispose();
  };

  private readonly clearOnProjectLoad = (): void => {
    this.controller.clear();
  };

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
