import {normalizeDiagnostic} from './diagnostic.js';
import type {Diagnostic, DiagnosticInput, DiagnosticSeverity} from './diagnostic.js';

export interface DiagnosticSvgOptions {
  width?: number;
  height?: number;
  maxMessageLines?: number;
  maxDetailLines?: number;
  maxExcerptLines?: number;
}

interface ResolvedOptions {
  width: number;
  height: number;
  maxMessageLines: number;
  maxDetailLines: number;
  maxExcerptLines: number;
}

interface SeverityTheme {
  accent: string;
  label: string;
}

const DEFAULT_OPTIONS: ResolvedOptions = {
  width: 480,
  height: 360,
  maxMessageLines: 3,
  maxDetailLines: 4,
  maxExcerptLines: 4
};

const THEMES: Record<DiagnosticSeverity, SeverityTheme> = {
  info: {accent: '#4CA6FF', label: 'INFO'},
  warning: {accent: '#F0C24B', label: 'WARNING'},
  error: {accent: '#FF6B6B', label: 'ERROR'},
  fatal: {accent: '#FF3B5C', label: 'FATAL'}
};

// XML 1.0 permits tab, line feed, and carriage return while rejecting other control characters.
// eslint-disable-next-line no-control-regex
const INVALID_XML_CHARACTER = /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;

export function renderDiagnosticSvg(
  input: Diagnostic | DiagnosticInput,
  options: DiagnosticSvgOptions = {}
): string {
  const diagnostic = normalizeDiagnostic(input);
  const resolved = resolveOptions(options);
  const theme = THEMES[diagnostic.severity];
  const padding = Math.max(18, Math.round(resolved.width * 0.055));
  const panelX = Math.max(8, Math.round(resolved.width * 0.025));
  const panelY = Math.max(8, Math.round(resolved.height * 0.035));
  const panelWidth = resolved.width - panelX * 2;
  const panelHeight = resolved.height - panelY * 2;
  const textX = panelX + padding;
  const textWidth = panelWidth - padding * 2;
  const titleSize = clamp(Math.round(resolved.height * 0.047), 13, 18);
  const messageSize = clamp(Math.round(resolved.height * 0.054), 15, 21);
  const bodySize = clamp(Math.round(resolved.height * 0.038), 12, 16);
  const smallSize = clamp(Math.round(resolved.height * 0.033), 11, 14);

  let cursorY = panelY + padding + titleSize;
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${resolved.width} ${resolved.height}" role="img" aria-labelledby="diagnostic-title diagnostic-description">`,
    `<title id="diagnostic-title">${escapeXml(`${theme.label} ${diagnostic.code}`)}</title>`,
    `<desc id="diagnostic-description">${escapeXml(accessibleDiagnosticText(diagnostic))}</desc>`,
    `<rect width="${resolved.width}" height="${resolved.height}" fill="#05070A" fill-opacity="0.42"/>`,
    `<rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="12" fill="#151922" fill-opacity="0.97" stroke="${theme.accent}" stroke-width="2"/>`,
    `<rect x="${panelX}" y="${panelY}" width="6" height="${panelHeight}" rx="3" fill="${theme.accent}"/>`,
    textElement([`${theme.label}  ${diagnostic.code}`], textX, cursorY, titleSize, theme.accent, 700)
  );

  cursorY += Math.round(messageSize * 1.7);
  const messageLines = truncateLines(
    wrapText(diagnostic.message, maxUnits(textWidth, messageSize)),
    resolved.maxMessageLines,
    maxUnits(textWidth, messageSize)
  );
  parts.push(textElement(messageLines, textX, cursorY, messageSize, '#FFFFFF', 700));
  cursorY += lineBlockHeight(messageLines.length, messageSize) + Math.round(bodySize * 0.85);

  if (diagnostic.detail) {
    const detailLines = truncateLines(
      wrapText(diagnostic.detail, maxUnits(textWidth, bodySize)),
      resolved.maxDetailLines,
      maxUnits(textWidth, bodySize)
    );
    parts.push(textElement(detailLines, textX, cursorY, bodySize, '#DCE2EE', 400));
    cursorY += lineBlockHeight(detailLines.length, bodySize) + Math.round(smallSize * 0.9);
  }

  const sourceLabel = formatSource(diagnostic);
  if (sourceLabel) {
    parts.push(textElement([sourceLabel], textX, cursorY, smallSize, '#AEB8CA', 600));
    cursorY += Math.round(smallSize * 1.65);
  }

  if (diagnostic.source?.excerpt) {
    const excerptY = cursorY - Math.round(smallSize * 0.78);
    const availableHeight = panelY + panelHeight - padding - excerptY;
    const possibleLines = Math.max(1, Math.floor(availableHeight / (smallSize * 1.35)));
    const excerptLineLimit = Math.min(resolved.maxExcerptLines, possibleLines);
    const excerptPadding = Math.max(8, Math.round(smallSize * 0.8));
    const excerptWidth = textWidth - excerptPadding * 2;
    const excerptLines = truncateLines(
      wrapText(diagnostic.source.excerpt, maxUnits(excerptWidth, smallSize)),
      excerptLineLimit,
      maxUnits(excerptWidth, smallSize)
    );
    const excerptHeight = lineBlockHeight(excerptLines.length, smallSize) + excerptPadding * 2;
    parts.push(
      `<rect x="${textX}" y="${excerptY}" width="${textWidth}" height="${excerptHeight}" rx="5" fill="#090C12" stroke="#303848"/>`,
      textElement(
        excerptLines,
        textX + excerptPadding,
        excerptY + excerptPadding + smallSize,
        smallSize,
        '#E7ECF5',
        400,
        'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
      )
    );
  }

  parts.push('</svg>');
  return parts.join('');
}

export function accessibleDiagnosticText(diagnostic: Diagnostic): string {
  return [
    diagnostic.severity.toUpperCase(),
    diagnostic.code,
    diagnostic.message,
    diagnostic.detail,
    formatSource(diagnostic),
    diagnostic.source?.excerpt
  ].filter((part): part is string => Boolean(part)).join('. ');
}

export function escapeXml(value: string): string {
  return value
    .replace(INVALID_XML_CHARACTER, '\uFFFD')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function resolveOptions(options: DiagnosticSvgOptions): ResolvedOptions {
  return {
    width: positiveInteger(options.width, DEFAULT_OPTIONS.width, 160, 4096),
    height: positiveInteger(options.height, DEFAULT_OPTIONS.height, 120, 4096),
    maxMessageLines: positiveInteger(options.maxMessageLines, DEFAULT_OPTIONS.maxMessageLines, 1, 12),
    maxDetailLines: positiveInteger(options.maxDetailLines, DEFAULT_OPTIONS.maxDetailLines, 1, 20),
    maxExcerptLines: positiveInteger(options.maxExcerptLines, DEFAULT_OPTIONS.maxExcerptLines, 1, 20)
  };
}

function positiveInteger(value: number | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value)) return fallback;
  return clamp(Math.round(value), min, max);
}

function textElement(
  lines: readonly string[],
  x: number,
  y: number,
  size: number,
  fill: string,
  weight: number,
  family = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
): string {
  const lineHeight = Math.round(size * 1.35);
  const tspans = lines.map((line, index) =>
    `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
  ).join('');
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${escapeXml(family)}" font-size="${size}" font-weight="${weight}" xml:space="preserve">${tspans}</text>`;
}

function wrapText(value: string, limit: number): string[] {
  const lines: string[] = [];
  for (const paragraph of value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')) {
    if (!paragraph) {
      lines.push(' ');
      continue;
    }
    let current = '';
    let units = 0;
    for (const character of Array.from(paragraph)) {
      const nextUnits = characterUnits(character);
      if (current && units + nextUnits > limit) {
        lines.push(current.trimEnd());
        current = character.trimStart();
        units = current ? nextUnits : 0;
      } else {
        current += character;
        units += nextUnits;
      }
    }
    if (current || lines.length === 0) lines.push(current.trimEnd());
  }
  return lines;
}

function truncateLines(lines: string[], limit: number, lineUnits: number): string[] {
  if (lines.length <= limit) return lines;
  const result = lines.slice(0, limit);
  const lastIndex = result.length - 1;
  const last = result[lastIndex] ?? '';
  result[lastIndex] = appendEllipsis(last, lineUnits);
  return result;
}

function appendEllipsis(value: string, limit: number): string {
  const ellipsis = '…';
  let result = value.trimEnd();
  while (result && textUnits(result) + characterUnits(ellipsis) > limit) {
    result = Array.from(result).slice(0, -1).join('').trimEnd();
  }
  return `${result}${ellipsis}`;
}

function characterUnits(character: string): number {
  if (/\p{Mark}/u.test(character)) return 0;
  if (/\s/u.test(character)) return 0.35;
  if (/^[\u0020-\u007e]$/u.test(character)) return 0.58;
  return 1;
}

function textUnits(value: string): number {
  return Array.from(value).reduce((total, character) => total + characterUnits(character), 0);
}

function maxUnits(width: number, fontSize: number): number {
  return Math.max(8, width / fontSize);
}

function lineBlockHeight(lineCount: number, fontSize: number): number {
  return fontSize + Math.max(0, lineCount - 1) * Math.round(fontSize * 1.35);
}

function formatSource(diagnostic: Diagnostic): string | undefined {
  const source = diagnostic.source;
  if (!source) return undefined;
  const position = [
    source.line === undefined ? undefined : `line ${source.line}`,
    source.column === undefined ? undefined : `column ${source.column}`
  ].filter((part): part is string => part !== undefined).join(', ');
  if (source.name && position) return `${source.name} — ${position}`;
  return source.name ?? (position || undefined);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
