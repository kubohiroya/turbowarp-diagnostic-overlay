# 段階2 Source/Form編集

この文書はローカル実装時の契約を示す。npm公開は実施しない。

- 対象: showDiagnosticJson.DIAGNOSTIC / diagnosticSvg.DIAGNOSTIC
- 契約: diagnostic
- Schema正本: schemas/diagnostic.schema.json。Schema文書はcanonical-schema、bundleは正本参照とprovenanceを保持する。
- owner受理条件: src/diagnostic.ts の parseDiagnosticJson。severity の空白・大小文字、trim後のUTF-16長、nullの任意値、正のsafe integerは同じowner検査で判定。severity候補はinfo/warning/error/fatal。

UIはSourceとFormを切り替える。無変更・cancel・編集後の元の値への復帰は入力文字列をそのまま保持する。Formの部分編集でも未知キー・null・空文字・配列の順序と重複・未編集箇所の表記を維持する。既定値の暗黙補完、variant/formatの暗黙移行、runtime正規化後の値の書き戻しは行わない。不正なsourceもSourceとして開き修復できるが、ownerに拒否される候補は保存できない。

利用条件は、GUI起動時に `blockEditorDialogs=1` と `blockEditorSourceForms=1` の両方を指定し、信頼した拡張をunsandboxedで読み込むこと。`Scratch.gui.blockEditors` はunsandboxed拡張APIにのみ提供される。既存のsandbox実行権限や拡張の既定の読み込み方法は変更しない。sandboxed実行では従来のブロックを使用し、編集capabilityがないためフォーム登録を省略する。

登録入口はoptionalな `Scratch.gui.blockEditors.registerSourceEditor`。GUIの起動時固定 `blockEditorSourceForms` は既定OFF、既存 `blockEditorDialogs` が前提となる。旧GUIやcapabilityを持たないhostでは登録を行わず、既存ブロックのAPI・引数・実行挙動は維持する。`dispose()` またはruntime破棄で登録を解除する。既存のruntime処理を実行せず、pure parser/validatorで保存候補の同じsourceを検査する。複数入力のブロックは単一editor definitionとして一度に検査・commitする。

依存: 共通エディターの新 `./schema` 型・json-value契約と新prepared save経路、およびGUIのcapabilityが必要。ローカル検証は独立cloneから新共通artifactへaliasする。遠隔配布用のpin・lockは最終共通artifactのSHA確定後に揃える。架空のSHAを記載しない。

受け入れ基準: 全対象inputの登録、既存受理との互換、Source修復、不正保存の拒否、no-opでundoを作らないこと、部分編集でraw値を維持すること、runtime破棄時の解除、既存APIのテスト・型検査・buildを確認する。原文不変・部分編集・拒否は `tests/source-editor.test.ts` から実際の共通serviceと接続して検証する。

ロールバック: 起動時 `blockEditorSourceForms` をOFFに戻してGUIを再起動する。登録capabilityを外すと新フォームは使用されず、既存のブロックと保存済みsourceは引き続き実行できる。Schema自体の編集・実行時の値からの動的Schema・値候補との接続は別工程。
