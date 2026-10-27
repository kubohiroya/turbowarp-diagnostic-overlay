# Changelog

このプロジェクトの注目すべき変更を記録します。形式は[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/)に基づき、[Semantic Versioning](https://semver.org/lang/ja/)に従います。

## [0.7.0] - 2026-10-27

### Changed

- 共通data-editorとmanifest 0.4.0、vite-plugin 0.9.0へ追従し、版・lockfile・配布物・利用例を更新します。
- 診断オーバーレイのruntime APIと拡張ブロックの契約を維持します。
- 切り戻しは`@kubohiroya/turbowarp-diagnostic-overlay@0.6.0`への固定です。

## [0.6.0] - 2026-10-26

### Changed

- 共通エディター0.3.4、ビルドプラグイン0.8.0へ追従し、配布物を再生成しました。
- 既存API・保存形式・既定OFFの機能フラグを維持します。

### Compatibility

- 移行は不要です。問題がある場合は0.5.1へ固定して切り戻せます。

## [0.5.1] - 2026-10-19

### Changed

- 既存の公開API・保存形式・既定OFFのフラグを維持し、共通エディターとビルド依存を検証済みの最新npm改訂版へ固定しました。
- 公開パッケージに基準Git SHAとリリース用変更状態のメタデータを追加しました。

### Compatibility

- 既存データの移行は不要です。flagをOFFにして再読込するか、`@kubohiroya/turbowarp-diagnostic-overlay@0.5.0`へ固定してロールバックできます。

## [0.5.0] - 2026-10-18

### Added

- 固定Schemaに基づくSource/Form編集とseverity選択、既存GUIの編集導線に必要なblock iconを追加しました。
- 起動時固定・既定OFFの`blockEditorSourceForms`と`blockEditorDialogs`により段階導入します。

### Compatibility

- 既存APIとraw保存形式を保持します。無変更・Cancelでは元の入力を維持します。
- flagをOFFにして再読込するか、`@kubohiroya/turbowarp-diagnostic-overlay@0.4.0`へ固定してロールバックできます。

## [0.4.0] - 2026-09-13

### Added

- TurboWarp block contractを機械検証するための決定的な`dist/extension-manifest.json`を追加しました。

### Compatibility

- 利用側は`@kubohiroya/turbowarp-diagnostic-overlay@0.3.0`へ固定してロールバックできます。

## [0.3.0] - 2026-09-10

### Changed

- リポジトリスクリプトを`.mjs`からTypeScriptへ移行し、Nodeのネイティブ型ストリッピングで実行するようにしました。
- `engines.node`を`>=22.18.0`に引き上げました。型ストリッピングがフラグなしで動作する最初のリリースです。
- ビルドをVite 8および`vite-plugin-turbowarp-extension` 0.3.0へ更新しました。生成される拡張機能バンドルが再生成されます。

## [0.2.0] - 2026-08-25

### Changed

- ルート`LICENSE`をMozilla Public License 2.0正式全文へ更新
- repository policyと`repo:check`を追加し、license、README、bundle metadata、package archiveを検査
- README、Pages、CHANGELOGの公開version表記を`0.2.0`へ同期

### Compatibility

- diagnostic validation、SVG生成、overlay lifecycle、Extension ID、opcodeは変更なし
- 利用側は`@kubohiroya/turbowarp-diagnostic-overlay@0.1.1`へ固定してロールバック可能

## [0.1.1] - 2026-08-06

### Added

- English/JapaneseのGitHub Pages利用ガイド
- ドキュメントの構造とローカルリンクを検証するsite check
- Pagesの自動deploy workflow

### Compatibility

- runtime API、ブロック、配布JavaScriptの挙動は0.1.0から変更なし
- 利用側は`@kubohiroya/turbowarp-diagnostic-overlay@0.1.0`へ固定してロールバック可能

## [0.1.0] - 2026-08-03

### Added

- 汎用`Diagnostic`データモデルとJSON validator
- XMLエスケープ済みの純粋SVG renderer
- TurboWarpステージに追従する非操作型DOM overlay
- 表示、JSON表示、消去、表示中判定、SVG生成、最後の診断JSONブロック
- 副作用のない`composition`、`diagnostic`、`svg-renderer` package exports

[0.2.0]: https://github.com/kubohiroya/turbowarp-diagnostic-overlay/releases/tag/v0.2.0
[0.1.1]: https://github.com/kubohiroya/turbowarp-diagnostic-overlay/releases/tag/v0.1.1
[0.1.0]: https://github.com/kubohiroya/turbowarp-diagnostic-overlay/releases/tag/v0.1.0
