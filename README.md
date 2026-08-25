# TurboWarp-Diagnostic-Overlay

An application-neutral TurboWarp extension that validates structured diagnostics, renders them as
safe SVG text, and displays them over the stage. It does not depend on a particular application or
DSL.

The [English guide](https://kubohiroya.github.io/turbowarp-diagnostic-overlay/) and
[Japanese guide](https://kubohiroya.github.io/turbowarp-diagnostic-overlay/ja/) cover installation,
the Composition API, safety, and lifecycle behavior.

## Responsibility boundary

This package validates diagnostic data, generates SVG, and displays, updates, or clears the current
overlay. The caller discovers diagnostics, stops projects or Scratch threads when appropriate, and
persists logs.

The renderer does not accept external SVG or HTML and XML-escapes every input string. The overlay
uses `pointer-events: none`, so it does not block mouse or touch input on the stage.

## Installation

Load [`dist/diagnostic-overlay.js`](dist/diagnostic-overlay.js) as a local custom extension in
TurboWarp Desktop and allow it to **run without the sandbox**.

When installing from npm, pin the reviewed version:

```bash
pnpm add --save-exact @kubohiroya/turbowarp-diagnostic-overlay@0.2.0
```

The standalone extension is also available from this version-pinned CDN URL:

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-diagnostic-overlay@0.2.0/dist/diagnostic-overlay.js
```

## Diagnostic JSON

The required fields are `severity`, `code`, and `message`. The `severity` value must be `info`,
`warning`, `error`, or `fatal`.

```json
{
  "severity": "error",
  "code": "DSL401",
  "message": "Stage is not defined",
  "detail": "stage2 has not been registered.",
  "source": {
    "name": "story.kamishibai",
    "line": 18,
    "column": 7,
    "excerpt": "goto: stage2"
  }
}
```

Line and column numbers are positive, one-based integers. Empty optional strings are treated as
omitted. Unknown fields are ignored for forward compatibility.

## Blocks

<!-- BEGIN GENERATED BLOCKS -->

### `show [SEVERITY] diagnostic [CODE]: [MESSAGE]`

Displays a simple diagnostic on the TurboWarp stage.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `showDiagnostic` |
| `SEVERITY` | String, default: `error`, menu: `severityMenu` |
| `CODE` | String, default: `APP001` |
| `MESSAGE` | String, default: `Something went wrong.` |

### `show diagnostic JSON [DIAGNOSTIC]`

Validates and displays one structured diagnostic JSON object.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `showDiagnosticJson` |
| `DIAGNOSTIC` | String, default: `{"severity":"error","code":"APP001","message":"Something went wrong."}` |

### `clear diagnostic overlay`

Removes the current diagnostic overlay without stopping the project.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `clearDiagnosticOverlay` |

### `diagnostic overlay is visible?`

Returns whether a diagnostic overlay is currently visible.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `diagnosticOverlayVisible` |
| Monitor | Disabled |

### `diagnostic SVG for JSON [DIAGNOSTIC]`

Returns safe SVG text for one diagnostic without displaying it.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `diagnosticSvg` |
| Monitor | Disabled |
| `DIAGNOSTIC` | String, default: `{"severity":"warning","code":"APP002","message":"Please check the input."}` |

### `last diagnostic JSON`

Returns the last displayed normalized diagnostic as JSON, or an empty string.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `lastDiagnosticJson` |
| Monitor | Disabled |

<!-- END GENERATED BLOCKS -->

## Composition API

The package root and `/composition` are side-effect-free ES modules and do not register an extension
with TurboWarp automatically.

```ts
import {
  createDiagnosticOverlayComposition,
  renderDiagnosticSvg
} from '@kubohiroya/turbowarp-diagnostic-overlay/composition';

const {extension, controller} = createDiagnosticOverlayComposition(Scratch);

// Register once at the composition root.
Scratch.extensions.register(extension);

controller.show({
  severity: 'error',
  code: 'APP001',
  message: 'Check the input.'
});

const svg = renderDiagnosticSvg({
  severity: 'warning',
  code: 'APP002',
  message: 'This value is deprecated.'
});
```

Import the pure renderer from `@kubohiroya/turbowarp-diagnostic-overlay/svg-renderer` when no
extension or overlay controller is needed.

See the [English specification](docs/specification.md) or
[Japanese specification](docs/ja/specification.md) for the complete contract.

## Development

Use Node.js 22.12 or later with Corepack.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
pnpm run release:check
```

`dist/diagnostic-overlay.js` is committed as a single reviewable file. Run `pnpm run docs` after
changing block definitions to update this README.

## Release

Keep the pinned version in `package.json`, this README, the public guides, and `CHANGELOG.md` in
sync in every release PR. After CI and the Pages deployment succeed on `main`, create a
`v<version>` tag on that merge commit. Pushing the tag creates the GitHub Release and standalone
extension artifact. Publish the same version to npm exactly once. Consumers can roll back by
pinning the preceding version.

## License

SPDX-License-Identifier: MPL-2.0
