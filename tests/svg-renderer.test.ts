import {describe, expect, it} from 'vitest';
import {escapeXml, renderDiagnosticSvg} from '../src/svg-renderer.js';

describe('SVG renderer', () => {
  it('renders all supported diagnostic fields as valid SVG', () => {
    const svg = renderDiagnosticSvg({
      severity: 'fatal',
      code: 'DSL401',
      message: '未定義のステージです',
      detail: 'stage2 は登録されていません。',
      source: {
        name: 'story.kamishibai',
        line: 18,
        column: 7,
        excerpt: 'goto: stage2'
      }
    });
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');

    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(svg).toContain('FATAL  DSL401');
    expect(svg).toContain('未定義のステージです');
    expect(svg).toContain('story.kamishibai — line 18, column 7');
    expect(svg).toContain('goto: stage2');
    expect(svg).toContain('role="img"');
  });

  it('escapes every user-controlled XML character', () => {
    const svg = renderDiagnosticSvg({
      severity: 'error',
      code: '<script>alert(1)</script>',
      message: '" & < > \'',
      source: {excerpt: '<image href="https://example.invalid/x">'}
    });

    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('<image');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('&quot; &amp; &lt; &gt; &apos;');
    expect(new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror')).toBeNull();
  });

  it('wraps Japanese text and marks omitted lines', () => {
    const svg = renderDiagnosticSvg(
      {
        severity: 'warning',
        code: 'LONG',
        message: 'これはとても長い日本語の診断メッセージです。'.repeat(30)
      },
      {width: 240, height: 180, maxMessageLines: 1}
    );
    expect(svg).toContain('…');
  });

  it('escapes XML independently', () => {
    expect(escapeXml('<&>"\'\u0000')).toBe('&lt;&amp;&gt;&quot;&apos;�');
  });
});
