export interface ScratchTranslate {
  (text: string): string;
  (message: {default: string; description?: string}, placeholders?: Record<string, string | number>): string;
}

export interface TurboWarpRuntime {
  renderer: {
    canvas: HTMLCanvasElement;
  };
  stageWidth?: number;
  stageHeight?: number;
  on?(eventName: string, listener: () => void): void;
  off?(eventName: string, listener: () => void): void;
}

export interface ScratchApi {
  extensions: {
    unsandboxed: boolean;
    register(extension: unknown): void;
  };
  BlockType: Record<'COMMAND' | 'REPORTER' | 'BOOLEAN', string>;
  ArgumentType: Record<'STRING', string>;
  Cast: {
    toString(value: unknown): string;
  };
  translate: ScratchTranslate;
  vm: {
    runtime: TurboWarpRuntime;
  };
}
