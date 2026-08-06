# Diagnostic Overlay 0.1 Specification

[English](./specification.md) | [日本語](./ja/specification.md)

## 1. Purpose

Diagnostic Overlay is a presentation component that displays one structured diagnostic supplied by
an application over the TurboWarp stage. It does not discover diagnostics, stop execution, or know
about application-specific types or commands such as the Kamishibai DSL.

## 2. Diagnostic model

```ts
type DiagnosticSeverity = 'info' | 'warning' | 'error' | 'fatal';

interface DiagnosticSource {
  name?: string;
  line?: number;
  column?: number;
  excerpt?: string;
}

interface Diagnostic {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  detail?: string;
  source?: DiagnosticSource;
}
```

`code` and `message` cannot be empty. `line` and `column` are positive, one-based safe integers.
JSON input is limited to 65,536 characters, and each string has its own limit.

## 3. SVG renderer

`renderDiagnosticSvg` is a pure function that returns the same SVG string for the same input and
options. It does not access Scratch, the DOM, or the TurboWarp VM.

- It draws text using only SVG `text` and `tspan` elements.
- It does not use `foreignObject`.
- It does not use input-derived strings as element names, attribute names, colors, or URLs.
- It converts `& < > " '` to XML entities and replaces XML 1.0-invalid control characters or
  malformed surrogates with `U+FFFD`.
- It wraps Japanese and other strings that do not contain spaces.
- It ends text with `…` when the content exceeds the number of displayable lines.

## 4. Overlay host

`BrowserStageOverlayHost` adds a DOM element with the same position and dimensions as the renderer
canvas to that canvas's parent element. The display element uses `pointer-events: none`. It follows
canvas size changes through `ResizeObserver` and the window `resize` event.

The host temporarily sets `position: relative` only when the parent uses static positioning, and
restores only its own change during disposal. Disposal is idempotent.

## 5. Lifecycle

- Showing a new diagnostic replaces the current display.
- `clear` removes the display and the last diagnostic.
- `PROJECT_LOADED` clears the preceding project's display.
- `RUNTIME_DISPOSED` releases the DOM, observer, and event listener.
- `PROJECT_STOP_ALL` does not clear the display, so the user can still read a diagnostic that caused
  execution to stop.

## 6. Composition

Importing `@kubohiroya/turbowarp-diagnostic-overlay/composition` has no side effects such as
TurboWarp registration. The host, controller, and extension are created only when
`createDiagnosticOverlayComposition(scratch, options)` is called.

The caller can register the returned `extension` at its own composition root. It can also replace
the `host` to render somewhere other than the DOM.

## 7. Non-responsibilities

- Validating DSLs, assets, expressions, or other application data
- Maintaining a queue or history of multiple diagnostics
- Stopping Scratch threads, the VM, or the project
- Displaying diagnostics automatically
- Persisting or transmitting logs
