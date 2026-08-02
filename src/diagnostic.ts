export const DIAGNOSTIC_SEVERITIES = ['info', 'warning', 'error', 'fatal'] as const;

export type DiagnosticSeverity = (typeof DIAGNOSTIC_SEVERITIES)[number];

export interface DiagnosticSource {
  name?: string;
  line?: number;
  column?: number;
  excerpt?: string;
}

export interface Diagnostic {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  detail?: string;
  source?: DiagnosticSource;
}

export interface DiagnosticInput {
  severity: DiagnosticSeverity | string;
  code: string;
  message: string;
  detail?: string;
  source?: DiagnosticSource;
}

const MAX_JSON_LENGTH = 65_536;
const MAX_CODE_LENGTH = 256;
const MAX_MESSAGE_LENGTH = 16_384;
const MAX_DETAIL_LENGTH = 32_768;
const MAX_SOURCE_NAME_LENGTH = 2_048;
const MAX_EXCERPT_LENGTH = 32_768;

export class DiagnosticValidationError extends Error {
  public constructor(
    public readonly path: string,
    message: string
  ) {
    super(`${path}: ${message}`);
    this.name = 'DiagnosticValidationError';
  }
}

export function parseDiagnosticJson(input: string): Diagnostic {
  if (input.length > MAX_JSON_LENGTH) {
    throw new DiagnosticValidationError('$', `JSON exceeds ${MAX_JSON_LENGTH} characters`);
  }

  let value: unknown;
  try {
    value = JSON.parse(input) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new DiagnosticValidationError('$', `invalid JSON (${detail})`);
  }
  return normalizeDiagnostic(value);
}

export function normalizeDiagnostic(value: unknown): Diagnostic {
  if (!isRecord(value)) {
    throw new DiagnosticValidationError('$', 'expected an object');
  }

  const severity = readSeverity(value.severity);
  const code = readRequiredText(value.code, '$.code', MAX_CODE_LENGTH);
  const message = readRequiredText(value.message, '$.message', MAX_MESSAGE_LENGTH);
  const detail = readOptionalText(value.detail, '$.detail', MAX_DETAIL_LENGTH);
  const source = readSource(value.source);

  return Object.freeze({
    severity,
    code,
    message,
    ...(detail === undefined ? {} : {detail}),
    ...(source === undefined ? {} : {source})
  });
}

export function diagnosticToJson(diagnostic: Diagnostic): string {
  return JSON.stringify(diagnostic);
}

function readSeverity(value: unknown): DiagnosticSeverity {
  if (typeof value !== 'string') {
    throw new DiagnosticValidationError('$.severity', 'expected a string');
  }
  const normalized = value.trim().toLowerCase();
  if (!isDiagnosticSeverity(normalized)) {
    throw new DiagnosticValidationError(
      '$.severity',
      `expected one of ${DIAGNOSTIC_SEVERITIES.join(', ')}`
    );
  }
  return normalized;
}

function readSource(value: unknown): DiagnosticSource | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    throw new DiagnosticValidationError('$.source', 'expected an object');
  }

  const name = readOptionalText(value.name, '$.source.name', MAX_SOURCE_NAME_LENGTH);
  const line = readOptionalPosition(value.line, '$.source.line');
  const column = readOptionalPosition(value.column, '$.source.column');
  const excerpt = readOptionalText(value.excerpt, '$.source.excerpt', MAX_EXCERPT_LENGTH);

  if (name === undefined && line === undefined && column === undefined && excerpt === undefined) {
    return undefined;
  }

  return Object.freeze({
    ...(name === undefined ? {} : {name}),
    ...(line === undefined ? {} : {line}),
    ...(column === undefined ? {} : {column}),
    ...(excerpt === undefined ? {} : {excerpt})
  });
}

function readRequiredText(value: unknown, path: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new DiagnosticValidationError(path, 'expected a string');
  }
  const normalized = value.trim();
  if (!normalized) throw new DiagnosticValidationError(path, 'must not be empty');
  if (normalized.length > maxLength) {
    throw new DiagnosticValidationError(path, `exceeds ${maxLength} characters`);
  }
  return normalized;
}

function readOptionalText(value: unknown, path: string, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new DiagnosticValidationError(path, 'expected a string');
  }
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > maxLength) {
    throw new DiagnosticValidationError(path, `exceeds ${maxLength} characters`);
  }
  return normalized;
}

function readOptionalPosition(value: unknown, path: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new DiagnosticValidationError(path, 'expected a positive integer');
  }
  return value as number;
}

function isDiagnosticSeverity(value: string): value is DiagnosticSeverity {
  return (DIAGNOSTIC_SEVERITIES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
