# TurboWarp Diagnostic Overlay

構造化された診断データを安全なSVGテキストへ変換し、TurboWarpステージ上に表示する汎用機能拡張です。紙芝居DSLなど特定のアプリケーションには依存しません。

## 責務の境界

このパッケージが担当するのは、診断データの検証、SVG生成、表示、更新、消去です。診断の発見、プロジェクトやScratchスレッドの停止、ログの永続化は利用側が担当します。

外部からSVGやHTMLを受け取らず、すべての入力文字列をXMLエスケープします。オーバーレイは`pointer-events: none`であり、ステージのマウス・タッチ入力を妨げません。

## インストール

TurboWarp Desktopで[`dist/diagnostic-overlay.js`](dist/diagnostic-overlay.js)をローカル機能拡張として読み込み、**サンドボックスなしで実行**を許可します。

npmから利用する場合はバージョンを固定してください。

```bash
pnpm add --save-exact @kubohiroya/turbowarp-diagnostic-overlay@0.1.0
```

CDN上の単独機能拡張は次のURLです。

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-diagnostic-overlay@0.1.0/dist/diagnostic-overlay.js
```

## 診断JSON

必須フィールドは`severity`、`code`、`message`です。`severity`は`info`、`warning`、`error`、`fatal`のいずれかです。

```json
{
  "severity": "error",
  "code": "DSL401",
  "message": "未定義のステージです",
  "detail": "stage2 は登録されていません。",
  "source": {
    "name": "story.kamishibai",
    "line": 18,
    "column": 7,
    "excerpt": "goto: stage2"
  }
}
```

行と列は1から始まる正の整数です。空の省略可能文字列は未指定として扱います。未知のフィールドは将来互換性のため無視します。

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

パッケージのルートまたは`/composition`は、TurboWarpへの自動登録を行わない副作用のないES moduleです。

```ts
import {
  createDiagnosticOverlayComposition,
  renderDiagnosticSvg
} from '@kubohiroya/turbowarp-diagnostic-overlay/composition';

const {extension, controller} = createDiagnosticOverlayComposition(Scratch);

// 集約側が一度だけ登録する。
Scratch.extensions.register(extension);

controller.show({
  severity: 'error',
  code: 'APP001',
  message: '入力を確認してください。'
});

const svg = renderDiagnosticSvg({
  severity: 'warning',
  code: 'APP002',
  message: 'この値は非推奨です。'
});
```

純粋なrendererだけを利用する場合は`@kubohiroya/turbowarp-diagnostic-overlay/svg-renderer`からimportできます。

詳しい契約は[`docs/specification.md`](docs/specification.md)を参照してください。

## 開発

Node.js 22.12以降とCorepackを使用します。

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
pnpm run release:check
```

`dist/diagnostic-overlay.js`はレビュー可能な単一ファイルとしてGitに含めます。ブロック定義を変更した場合は`pnpm run docs`でREADMEを更新します。

## ライセンス

MPL-2.0
