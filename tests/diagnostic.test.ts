import {describe, expect, it} from 'vitest';
import {
  DiagnosticValidationError,
  diagnosticToJson,
  normalizeDiagnostic,
  parseDiagnosticJson
} from '../src/diagnostic.js';

describe('diagnostic model', () => {
  it('normalizes a complete diagnostic and removes surrounding whitespace', () => {
    const diagnostic = normalizeDiagnostic({
      severity: ' WARNING ',
      code: ' DSL004 ',
      message: ' Unknown command ',
      detail: ' Use a registered command. ',
      source: {name: 'story.txt', line: 12, column: 4, excerpt: ' action=nope '}
    });

    expect(diagnostic).toEqual({
      severity: 'warning',
      code: 'DSL004',
      message: 'Unknown command',
      detail: 'Use a registered command.',
      source: {name: 'story.txt', line: 12, column: 4, excerpt: 'action=nope'}
    });
    expect(Object.isFrozen(diagnostic)).toBe(true);
    expect(Object.isFrozen(diagnostic.source)).toBe(true);
  });

  it('parses JSON and returns stable normalized JSON', () => {
    const diagnostic = parseDiagnosticJson(
      '{"severity":"error","code":"E1","message":"broken","source":{"line":3}}'
    );
    expect(diagnosticToJson(diagnostic)).toBe(
      '{"severity":"error","code":"E1","message":"broken","source":{"line":3}}'
    );
  });

  it.each([
    [{}, '$.severity'],
    [{severity: 'debug', code: 'E1', message: 'bad'}, '$.severity'],
    [{severity: 'error', code: '', message: 'bad'}, '$.code'],
    [{severity: 'error', code: 'E1', message: ''}, '$.message'],
    [{severity: 'error', code: 'E1', message: 'bad', source: {line: 0}}, '$.source.line'],
    [{severity: 'error', code: 'E1', message: 'bad', source: []}, '$.source']
  ])('rejects invalid input at %s', (input, path) => {
    expect(() => normalizeDiagnostic(input)).toThrowError(DiagnosticValidationError);
    expect(() => normalizeDiagnostic(input)).toThrowError(path as string);
  });

  it('reports malformed and excessively large JSON', () => {
    expect(() => parseDiagnosticJson('{')).toThrowError('$: invalid JSON');
    expect(() => parseDiagnosticJson(' '.repeat(65_537))).toThrowError('exceeds 65536');
  });
});
