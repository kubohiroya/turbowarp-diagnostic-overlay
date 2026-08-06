# Changelog

このプロジェクトの注目すべき変更を記録します。形式は[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/)に基づき、[Semantic Versioning](https://semver.org/lang/ja/)に従います。

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

[0.1.1]: https://github.com/kubohiroya/turbowarp-diagnostic-overlay/releases/tag/v0.1.1
[0.1.0]: https://github.com/kubohiroya/turbowarp-diagnostic-overlay/releases/tag/v0.1.0
