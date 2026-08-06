# Diagnostic Overlay 0.1 仕様

[English](../specification.md) | [日本語](./specification.md)

## 1. 目的

Diagnostic Overlayは、アプリケーションから受け取った一件の構造化診断をTurboWarpステージ上に表示するpresentation componentである。診断を発見せず、実行を停止せず、紙芝居固有の型やコマンドを知らない。

## 2. 診断モデル

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

`code`と`message`は空にできない。`line`と`column`は1から始まる安全な整数である。JSON入力には65,536文字の上限を設け、各文字列にも個別の上限を設ける。

## 3. SVG renderer

`renderDiagnosticSvg`は同じ入力とoptionsに対して同じSVG文字列を返す純粋関数である。Scratch、DOM、TurboWarp VMを参照しない。

- SVGの`text`と`tspan`のみで文字を描画する。
- `foreignObject`を使用しない。
- 入力由来の文字列を要素名、属性名、色、URLとして使用しない。
- `& < > " '`をXML entityへ変換し、XML 1.0で無効な制御文字や不正なサロゲートを`U+FFFD`へ置換する。
- 日本語など空白を含まない文字列も折り返す。
- 表示可能行数を超えた場合は末尾を`…`にする。

## 4. Overlay host

`BrowserStageOverlayHost`はrenderer canvasと同じ位置・大きさのDOM要素をcanvasの親要素に追加する。表示要素は`pointer-events: none`である。canvasのサイズ変更を`ResizeObserver`とwindowの`resize`イベントで追従する。

親要素がstatic positioningの場合だけ一時的に`position: relative`を設定し、dispose時に自分が行った変更を復元する。disposeは複数回呼び出せる。

## 5. ライフサイクル

- 新しい診断を表示すると現在の表示を置換する。
- `clear`は表示と最後の診断を消去する。
- `PROJECT_LOADED`では古いプロジェクトの表示を消去する。
- `RUNTIME_DISPOSED`ではDOM、observer、event listenerを解放する。
- `PROJECT_STOP_ALL`では表示を消去しない。停止原因となった診断を利用者が読めるようにするためである。

## 6. Composition

`@kubohiroya/turbowarp-diagnostic-overlay/composition`のimportにはTurboWarp登録などの副作用がない。`createDiagnosticOverlayComposition(scratch, options)`を呼び出したときだけhost、controller、extensionを生成する。

利用側は返された`extension`を自身のcomposition rootで登録できる。また`host`を差し替えることでDOM以外の表示先を利用できる。

## 7. 非責務

- DSL、アセット、式などの検証
- 複数診断のキューや履歴
- Scratch thread、VM、プロジェクトの停止
- 診断の自動表示
- ログの永続化や外部送信
