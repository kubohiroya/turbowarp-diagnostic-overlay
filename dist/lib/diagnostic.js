export const DIAGNOSTIC_SEVERITIES = ['info', 'warning', 'error', 'fatal'];
const MAX_JSON_LENGTH = 65_536;
const MAX_CODE_LENGTH = 256;
const MAX_MESSAGE_LENGTH = 16_384;
const MAX_DETAIL_LENGTH = 32_768;
const MAX_SOURCE_NAME_LENGTH = 2_048;
const MAX_EXCERPT_LENGTH = 32_768;
export class DiagnosticValidationError extends Error {
    path;
    constructor(path, message) {
        super(`${path}: ${message}`);
        this.path = path;
        this.name = 'DiagnosticValidationError';
    }
}
export function parseDiagnosticJson(input) {
    if (input.length > MAX_JSON_LENGTH) {
        throw new DiagnosticValidationError('$', `JSON exceeds ${MAX_JSON_LENGTH} characters`);
    }
    let value;
    try {
        value = JSON.parse(input);
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new DiagnosticValidationError('$', `invalid JSON (${detail})`);
    }
    return normalizeDiagnostic(value);
}
export function normalizeDiagnostic(value) {
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
        ...(detail === undefined ? {} : { detail }),
        ...(source === undefined ? {} : { source })
    });
}
export function diagnosticToJson(diagnostic) {
    return JSON.stringify(diagnostic);
}
function readSeverity(value) {
    if (typeof value !== 'string') {
        throw new DiagnosticValidationError('$.severity', 'expected a string');
    }
    const normalized = value.trim().toLowerCase();
    if (!isDiagnosticSeverity(normalized)) {
        throw new DiagnosticValidationError('$.severity', `expected one of ${DIAGNOSTIC_SEVERITIES.join(', ')}`);
    }
    return normalized;
}
function readSource(value) {
    if (value === undefined || value === null)
        return undefined;
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
        ...(name === undefined ? {} : { name }),
        ...(line === undefined ? {} : { line }),
        ...(column === undefined ? {} : { column }),
        ...(excerpt === undefined ? {} : { excerpt })
    });
}
function readRequiredText(value, path, maxLength) {
    if (typeof value !== 'string') {
        throw new DiagnosticValidationError(path, 'expected a string');
    }
    const normalized = value.trim();
    if (!normalized)
        throw new DiagnosticValidationError(path, 'must not be empty');
    if (normalized.length > maxLength) {
        throw new DiagnosticValidationError(path, `exceeds ${maxLength} characters`);
    }
    return normalized;
}
function readOptionalText(value, path, maxLength) {
    if (value === undefined || value === null)
        return undefined;
    if (typeof value !== 'string') {
        throw new DiagnosticValidationError(path, 'expected a string');
    }
    const normalized = value.trim();
    if (!normalized)
        return undefined;
    if (normalized.length > maxLength) {
        throw new DiagnosticValidationError(path, `exceeds ${maxLength} characters`);
    }
    return normalized;
}
function readOptionalPosition(value, path) {
    if (value === undefined || value === null)
        return undefined;
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new DiagnosticValidationError(path, 'expected a positive integer');
    }
    return value;
}
function isDiagnosticSeverity(value) {
    return DIAGNOSTIC_SEVERITIES.includes(value);
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=diagnostic.js.map