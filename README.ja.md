# TurboWarp-Diagnostic-Overlay

<img src="assets/block-icon.svg" alt="" width="48" height="48">

[English](README.md) | 日本語

構造化された診断データを検証し、安全なSVGテキストとして描画して、ステージ上に表示する
アプリケーション非依存のTurboWarp拡張機能です。特定のアプリケーションやDSLに依存しません。

導入手順、Composition API、安全性、lifecycleの挙動は
[English guide](https://kubohiroya.github.io/turbowarp-diagnostic-overlay/)および
[日本語ガイド](https://kubohiroya.github.io/turbowarp-diagnostic-overlay/ja/)で扱っています。

## 責務の境界

このpackageが行うのは、診断データの検証、SVGの生成、現在のoverlayの表示・更新・消去です。診断の検出、
必要に応じたプロジェクトやScratch threadの停止、ログの永続化は呼び出し側の責務です。

rendererは外部のSVGやHTMLを受け付けず、入力文字列をすべてXMLエスケープします。overlayは
`pointer-events: none`を使うため、ステージ上のマウスやタッチの入力を妨げません。

## インストール

[`dist/diagnostic-overlay.js`](dist/diagnostic-overlay.js)をTurboWarp Desktopでローカルの
カスタム拡張機能として読み込み、**サンドボックス化せずに実行**を許可します。

npmから導入する場合は、レビュー済みのversionを固定します。

```bash
pnpm add --save-exact @kubohiroya/turbowarp-diagnostic-overlay@0.7.0
```

standaloneの拡張機能は、version固定の次のCDN URLからも取得できます。

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-diagnostic-overlay@0.7.0/dist/diagnostic-overlay.js
```

機械可読なblock API manifestは、ビルド時に`src/block-definitions.json`から生成します。利用側は
実行時bundleを評価することなく、拡張機能ID、opcode、block種別、引数のIDと型、menu参照を固定して
検証できます。

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-diagnostic-overlay@0.7.0/dist/extension-manifest.json
```

## 診断JSON

必須フィールドは`severity`、`code`、`message`です。`severity`の値は`info`、`warning`、`error`、
`fatal`のいずれかでなければなりません。

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

行番号と列番号は1始まりの正の整数です。空文字列の任意フィールドは省略として扱います。未知の
フィールドは前方互換のため無視します。

## ブロック

| block | 種別 | opcode | 動作 |
|---|---|---|---|
| `show [SEVERITY] diagnostic [CODE]: [MESSAGE]` | Command | `showDiagnostic` | 単純な診断をTurboWarpのステージへ表示します。 |
| `show diagnostic JSON [DIAGNOSTIC]` | Command | `showDiagnosticJson` | 構造化された診断JSONを1件検証して表示します。 |
| `clear diagnostic overlay` | Command | `clearDiagnosticOverlay` | プロジェクトを停止せずに現在のoverlayを消します。 |
| `diagnostic overlay is visible?` | Boolean | `diagnosticOverlayVisible` | 診断overlayが表示中かどうかを返します。 |
| `diagnostic SVG for JSON [DIAGNOSTIC]` | Reporter | `diagnosticSvg` | 表示せずに、診断1件分の安全なSVGテキストを返します。 |
| `last diagnostic JSON` | Reporter | `lastDiagnosticJson` | 最後に表示した正規化済みの診断をJSONで返します。無ければ空文字列です。 |

`SEVERITY`は`severityMenu`から選び既定は`error`、`CODE`の既定は`APP001`です。reporter系と
`diagnostic overlay is visible?`はmonitorを無効にしています。

## Composition API

packageのrootと`/composition`はside effectのないESmoduleで、TurboWarpへ拡張機能を自動登録しません。

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

拡張機能もoverlay controllerも不要な場合は、純粋なrendererを
`@kubohiroya/turbowarp-diagnostic-overlay/svg-renderer`からimportしてください。

完全な契約は[日本語仕様](docs/ja/specification.md)または[English specification](docs/specification.md)を
参照してください。

## 開発

Node.js 24以降とCorepackを使います。

```bash
npm install --global corepack@latest
corepack enable
pnpm install --frozen-lockfile
pnpm run check
pnpm run release:check
```

`dist/diagnostic-overlay.js`と`dist/extension-manifest.json`は、レビュー可能な生成成果物として
commitしてあります。block定義を変更したら`pnpm run docs`を実行してREADMEを更新してください。

## リリース

`package.json`、このREADME、公開ガイド、`CHANGELOG.md`の固定versionは、リリースのPRごとに揃えて
ください。`main`でCIとPagesのデプロイが成功したら、そのmerge commitに`v<version>`タグを作成します。
タグをpushするとGitHub Releaseとstandalone拡張機能の成果物が作られます。同じversionをnpmへ
ちょうど1回公開します。利用側は直前のversionを固定することで切り戻せます。

## ライセンス

SPDX-License-Identifier: MPL-2.0

## 固定引数の編集フォーム（S3-4）

共通エディターの起動時フラグ `blockEditorFixedInputs` とDialogsがONのGUIでは、`showDiagnostic` の `SEVERITY` だけを固定フォームとして登録します。旧GUI・フラグOFFでは追加登録を行いません。Schemaの正本は `schemas/block-editor-fixed-inputs.schema.json#/$defs/showDiagnostic/properties/SEVERITY`、codecと登録は `src/fixed-input-editors.ts` です。既存raw値・未変更alias・未知enumは無操作保存で書き換えず、reporterを評価しません。明示変更だけを検査し、他の引数やブロック宣言、保存形式を変更しません。

SEVERITYの候補はinfo/warning/error/fatalです。既存runtimeのtrim/lowercaseを投影へ適用し、未変更の原文は保持します。CODE/MESSAGEは今回のbindingに追加しません。

登録はoptional API（apiVersion:1）に限定し、RUNTIME_DISPOSED/明示disposeで解除します。起動フラグOFF＋再読込で従来経路へ切り戻せます。依存を戻す場合はmanifest/lock/実解決を一組で復旧します。npm公開や後続段階の動的候補は含みません。

Schemaが記述する契約の根拠は実getInfoの宣言と既存の純粋なruntime変換です。SchemaBundleのretrievalUriはこのローカル文書の識別子であり、URL配信済み・HTTP取得によるref解決を意味しません。Schemaは同梱文書だけでcompileします。

登録には、拡張機能のinstanceを構築した時点で利用できる任意のeditor APIを使います。そのAPIを後から追加・差し替えしても自動では追従しません。起動時の設定を変更したら、GUIを再読み込みして拡張機能のinstanceを作り直してください。
