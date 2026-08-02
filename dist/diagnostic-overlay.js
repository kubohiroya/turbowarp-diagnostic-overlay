// Name: Diagnostic Overlay
// ID: kubohiroyadiagnosticoverlay
// Description: Render structured diagnostics as safe SVG overlays on the TurboWarp stage.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  const extensionName = "Diagnostic Overlay";
  const blocks = [{ "opcode": "showDiagnostic", "blockType": "COMMAND", "text": "show [SEVERITY] diagnostic [CODE]: [MESSAGE]", "description": "Displays a simple diagnostic on the TurboWarp stage.", "arguments": { "SEVERITY": { "type": "STRING", "defaultValue": "error", "menu": "severityMenu" }, "CODE": { "type": "STRING", "defaultValue": "APP001" }, "MESSAGE": { "type": "STRING", "defaultValue": "Something went wrong." } } }, { "opcode": "showDiagnosticJson", "blockType": "COMMAND", "text": "show diagnostic JSON [DIAGNOSTIC]", "description": "Validates and displays one structured diagnostic JSON object.", "arguments": { "DIAGNOSTIC": { "type": "STRING", "defaultValue": '{"severity":"error","code":"APP001","message":"Something went wrong."}' } } }, { "opcode": "clearDiagnosticOverlay", "blockType": "COMMAND", "text": "clear diagnostic overlay", "description": "Removes the current diagnostic overlay without stopping the project.", "arguments": {} }, { "opcode": "diagnosticOverlayVisible", "blockType": "BOOLEAN", "text": "diagnostic overlay is visible?", "description": "Returns whether a diagnostic overlay is currently visible.", "disableMonitor": true, "arguments": {} }, { "opcode": "diagnosticSvg", "blockType": "REPORTER", "text": "diagnostic SVG for JSON [DIAGNOSTIC]", "description": "Returns safe SVG text for one diagnostic without displaying it.", "disableMonitor": true, "arguments": { "DIAGNOSTIC": { "type": "STRING", "defaultValue": '{"severity":"warning","code":"APP002","message":"Please check the input."}' } } }, { "opcode": "lastDiagnosticJson", "blockType": "REPORTER", "text": "last diagnostic JSON", "description": "Returns the last displayed normalized diagnostic as JSON, or an empty string.", "disableMonitor": true, "arguments": {} }];
  const definitions = {
    extensionName,
    blocks
  };
  const extensionConfig = {
    id: "kubohiroyadiagnosticoverlay",
    name: "Diagnostic Overlay"
  };
  const DIAGNOSTIC_SEVERITIES = ["info", "warning", "error", "fatal"];
  const MAX_JSON_LENGTH = 65536;
  const MAX_CODE_LENGTH = 256;
  const MAX_MESSAGE_LENGTH = 16384;
  const MAX_DETAIL_LENGTH = 32768;
  const MAX_SOURCE_NAME_LENGTH = 2048;
  const MAX_EXCERPT_LENGTH = 32768;
  class DiagnosticValidationError extends Error {
    constructor(path, message) {
      super(`${path}: ${message}`);
      __publicField(this, "path");
      this.path = path;
      this.name = "DiagnosticValidationError";
    }
  }
  function parseDiagnosticJson(input) {
    if (input.length > MAX_JSON_LENGTH) {
      throw new DiagnosticValidationError("$", `JSON exceeds ${MAX_JSON_LENGTH} characters`);
    }
    let value;
    try {
      value = JSON.parse(input);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new DiagnosticValidationError("$", `invalid JSON (${detail})`);
    }
    return normalizeDiagnostic(value);
  }
  function normalizeDiagnostic(value) {
    if (!isRecord(value)) {
      throw new DiagnosticValidationError("$", "expected an object");
    }
    const severity = readSeverity(value.severity);
    const code = readRequiredText(value.code, "$.code", MAX_CODE_LENGTH);
    const message = readRequiredText(value.message, "$.message", MAX_MESSAGE_LENGTH);
    const detail = readOptionalText(value.detail, "$.detail", MAX_DETAIL_LENGTH);
    const source = readSource(value.source);
    return Object.freeze({
      severity,
      code,
      message,
      ...detail === void 0 ? {} : { detail },
      ...source === void 0 ? {} : { source }
    });
  }
  function diagnosticToJson(diagnostic) {
    return JSON.stringify(diagnostic);
  }
  function readSeverity(value) {
    if (typeof value !== "string") {
      throw new DiagnosticValidationError("$.severity", "expected a string");
    }
    const normalized = value.trim().toLowerCase();
    if (!isDiagnosticSeverity(normalized)) {
      throw new DiagnosticValidationError(
        "$.severity",
        `expected one of ${DIAGNOSTIC_SEVERITIES.join(", ")}`
      );
    }
    return normalized;
  }
  function readSource(value) {
    if (value === void 0 || value === null) return void 0;
    if (!isRecord(value)) {
      throw new DiagnosticValidationError("$.source", "expected an object");
    }
    const name = readOptionalText(value.name, "$.source.name", MAX_SOURCE_NAME_LENGTH);
    const line = readOptionalPosition(value.line, "$.source.line");
    const column = readOptionalPosition(value.column, "$.source.column");
    const excerpt = readOptionalText(value.excerpt, "$.source.excerpt", MAX_EXCERPT_LENGTH);
    if (name === void 0 && line === void 0 && column === void 0 && excerpt === void 0) {
      return void 0;
    }
    return Object.freeze({
      ...name === void 0 ? {} : { name },
      ...line === void 0 ? {} : { line },
      ...column === void 0 ? {} : { column },
      ...excerpt === void 0 ? {} : { excerpt }
    });
  }
  function readRequiredText(value, path, maxLength) {
    if (typeof value !== "string") {
      throw new DiagnosticValidationError(path, "expected a string");
    }
    const normalized = value.trim();
    if (!normalized) throw new DiagnosticValidationError(path, "must not be empty");
    if (normalized.length > maxLength) {
      throw new DiagnosticValidationError(path, `exceeds ${maxLength} characters`);
    }
    return normalized;
  }
  function readOptionalText(value, path, maxLength) {
    if (value === void 0 || value === null) return void 0;
    if (typeof value !== "string") {
      throw new DiagnosticValidationError(path, "expected a string");
    }
    const normalized = value.trim();
    if (!normalized) return void 0;
    if (normalized.length > maxLength) {
      throw new DiagnosticValidationError(path, `exceeds ${maxLength} characters`);
    }
    return normalized;
  }
  function readOptionalPosition(value, path) {
    if (value === void 0 || value === null) return void 0;
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new DiagnosticValidationError(path, "expected a positive integer");
    }
    return value;
  }
  function isDiagnosticSeverity(value) {
    return DIAGNOSTIC_SEVERITIES.includes(value);
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  const blockDefinitions = definitions.blocks;
  class DiagnosticOverlayExtension {
    constructor(scratch, controller) {
      __publicField(this, "scratch");
      __publicField(this, "controller");
      __publicField(this, "runtime");
      __publicField(this, "disposed", false);
      __publicField(this, "dispose", () => {
        if (this.disposed) return;
        this.disposed = true;
        this.runtime.off?.("PROJECT_LOADED", this.clearOnProjectLoad);
        this.runtime.off?.("RUNTIME_DISPOSED", this.dispose);
        this.controller.dispose();
      });
      __publicField(this, "clearOnProjectLoad", () => {
        this.controller.clear();
      });
      this.scratch = scratch;
      this.controller = controller;
      this.runtime = scratch.vm.runtime;
      this.runtime.on?.("PROJECT_LOADED", this.clearOnProjectLoad);
      this.runtime.on?.("RUNTIME_DISPOSED", this.dispose);
    }
    getInfo() {
      return {
        id: extensionConfig.id,
        name: this.scratch.translate(definitions.extensionName),
        color1: "#C44747",
        color2: "#A83B3B",
        color3: "#8C3030",
        blocks: blockDefinitions.map((block) => this.toScratchBlock(block)),
        menus: {
          severityMenu: {
            acceptReporters: true,
            items: ["info", "warning", "error", "fatal"]
          }
        }
      };
    }
    showDiagnostic(args) {
      const diagnostic = {
        severity: this.severity(args.SEVERITY),
        code: this.string(args.CODE),
        message: this.string(args.MESSAGE)
      };
      this.controller.show(diagnostic);
    }
    showDiagnosticJson(args) {
      this.controller.show(parseDiagnosticJson(this.string(args.DIAGNOSTIC)));
    }
    clearDiagnosticOverlay() {
      this.controller.clear();
    }
    diagnosticOverlayVisible() {
      return this.controller.isVisible();
    }
    diagnosticSvg(args) {
      return this.controller.render(parseDiagnosticJson(this.string(args.DIAGNOSTIC)));
    }
    lastDiagnosticJson() {
      return this.controller.lastDiagnosticJson();
    }
    toScratchBlock(block) {
      return {
        opcode: block.opcode,
        blockType: this.scratch.BlockType[block.blockType],
        text: this.scratch.translate(block.text),
        ...block.disableMonitor ? { disableMonitor: true } : {},
        arguments: Object.fromEntries(
          Object.entries(block.arguments).map(([name, argument]) => [
            name,
            {
              type: this.scratch.ArgumentType[argument.type],
              defaultValue: argument.defaultValue,
              ...argument.menu ? { menu: argument.menu } : {}
            }
          ])
        )
      };
    }
    string(value) {
      return this.scratch.Cast.toString(value);
    }
    severity(value) {
      const severity = this.string(value).trim().toLowerCase();
      if (severity === "info" || severity === "warning" || severity === "error" || severity === "fatal") {
        return severity;
      }
      throw new Error(`Unsupported diagnostic severity: ${severity}`);
    }
  }
  const DEFAULT_OPTIONS = {
    width: 480,
    height: 360,
    maxMessageLines: 3,
    maxDetailLines: 4,
    maxExcerptLines: 4
  };
  const THEMES = {
    info: { accent: "#4CA6FF", label: "INFO" },
    warning: { accent: "#F0C24B", label: "WARNING" },
    error: { accent: "#FF6B6B", label: "ERROR" },
    fatal: { accent: "#FF3B5C", label: "FATAL" }
  };
  const INVALID_XML_CHARACTER = /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;
  function renderDiagnosticSvg(input, options = {}) {
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
    const parts = [];
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
    parts.push(textElement(messageLines, textX, cursorY, messageSize, "#FFFFFF", 700));
    cursorY += lineBlockHeight(messageLines.length, messageSize) + Math.round(bodySize * 0.85);
    if (diagnostic.detail) {
      const detailLines = truncateLines(
        wrapText(diagnostic.detail, maxUnits(textWidth, bodySize)),
        resolved.maxDetailLines,
        maxUnits(textWidth, bodySize)
      );
      parts.push(textElement(detailLines, textX, cursorY, bodySize, "#DCE2EE", 400));
      cursorY += lineBlockHeight(detailLines.length, bodySize) + Math.round(smallSize * 0.9);
    }
    const sourceLabel = formatSource(diagnostic);
    if (sourceLabel) {
      parts.push(textElement([sourceLabel], textX, cursorY, smallSize, "#AEB8CA", 600));
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
          "#E7ECF5",
          400,
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        )
      );
    }
    parts.push("</svg>");
    return parts.join("");
  }
  function accessibleDiagnosticText(diagnostic) {
    return [
      diagnostic.severity.toUpperCase(),
      diagnostic.code,
      diagnostic.message,
      diagnostic.detail,
      formatSource(diagnostic),
      diagnostic.source?.excerpt
    ].filter((part) => Boolean(part)).join(". ");
  }
  function escapeXml(value) {
    return value.replace(INVALID_XML_CHARACTER, "�").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
  }
  function resolveOptions(options) {
    return {
      width: positiveInteger(options.width, DEFAULT_OPTIONS.width, 160, 4096),
      height: positiveInteger(options.height, DEFAULT_OPTIONS.height, 120, 4096),
      maxMessageLines: positiveInteger(options.maxMessageLines, DEFAULT_OPTIONS.maxMessageLines, 1, 12),
      maxDetailLines: positiveInteger(options.maxDetailLines, DEFAULT_OPTIONS.maxDetailLines, 1, 20),
      maxExcerptLines: positiveInteger(options.maxExcerptLines, DEFAULT_OPTIONS.maxExcerptLines, 1, 20)
    };
  }
  function positiveInteger(value, fallback, min, max) {
    if (value === void 0) return fallback;
    if (!Number.isFinite(value)) return fallback;
    return clamp(Math.round(value), min, max);
  }
  function textElement(lines, x, y, size, fill, weight, family = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif') {
    const lineHeight = Math.round(size * 1.35);
    const tspans = lines.map(
      (line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    ).join("");
    return `<text x="${x}" y="${y}" fill="${fill}" font-family="${escapeXml(family)}" font-size="${size}" font-weight="${weight}" xml:space="preserve">${tspans}</text>`;
  }
  function wrapText(value, limit) {
    const lines = [];
    for (const paragraph of value.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n")) {
      if (!paragraph) {
        lines.push(" ");
        continue;
      }
      let current = "";
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
  function truncateLines(lines, limit, lineUnits) {
    if (lines.length <= limit) return lines;
    const result = lines.slice(0, limit);
    const lastIndex = result.length - 1;
    const last = result[lastIndex] ?? "";
    result[lastIndex] = appendEllipsis(last, lineUnits);
    return result;
  }
  function appendEllipsis(value, limit) {
    const ellipsis = "…";
    let result = value.trimEnd();
    while (result && textUnits(result) + characterUnits(ellipsis) > limit) {
      result = Array.from(result).slice(0, -1).join("").trimEnd();
    }
    return `${result}${ellipsis}`;
  }
  function characterUnits(character) {
    if (/\p{Mark}/u.test(character)) return 0;
    if (/\s/u.test(character)) return 0.35;
    if (/^[\u0020-\u007e]$/u.test(character)) return 0.58;
    return 1;
  }
  function textUnits(value) {
    return Array.from(value).reduce((total, character) => total + characterUnits(character), 0);
  }
  function maxUnits(width, fontSize) {
    return Math.max(8, width / fontSize);
  }
  function lineBlockHeight(lineCount, fontSize) {
    return fontSize + Math.max(0, lineCount - 1) * Math.round(fontSize * 1.35);
  }
  function formatSource(diagnostic) {
    const source = diagnostic.source;
    if (!source) return void 0;
    const position = [
      source.line === void 0 ? void 0 : `line ${source.line}`,
      source.column === void 0 ? void 0 : `column ${source.column}`
    ].filter((part) => part !== void 0).join(", ");
    if (source.name && position) return `${source.name} — ${position}`;
    return source.name ?? (position || void 0);
  }
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  class DiagnosticOverlayController {
    constructor(host, svgOptions = {}) {
      __publicField(this, "host");
      __publicField(this, "svgOptions");
      __publicField(this, "lastDiagnostic", null);
      this.host = host;
      this.svgOptions = svgOptions;
    }
    show(input) {
      const diagnostic = normalizeDiagnostic(input);
      const svg = renderDiagnosticSvg(diagnostic, this.svgOptions);
      this.host.showSvg(svg, accessibleDiagnosticText(diagnostic));
      this.lastDiagnostic = diagnostic;
      return svg;
    }
    render(input) {
      return renderDiagnosticSvg(normalizeDiagnostic(input), this.svgOptions);
    }
    clear() {
      this.host.clear();
      this.lastDiagnostic = null;
    }
    isVisible() {
      return this.host.isVisible();
    }
    lastDiagnosticJson() {
      return this.lastDiagnostic === null ? "" : diagnosticToJson(this.lastDiagnostic);
    }
    dispose() {
      this.lastDiagnostic = null;
      this.host.dispose();
    }
  }
  class BrowserStageOverlayHost {
    constructor(canvas, document = canvas.ownerDocument) {
      __publicField(this, "canvas");
      __publicField(this, "document");
      __publicField(this, "container");
      __publicField(this, "parent");
      __publicField(this, "window");
      __publicField(this, "resizeObserver", null);
      __publicField(this, "changedParentPosition", false);
      __publicField(this, "previousParentPosition", "");
      __publicField(this, "disposed", false);
      __publicField(this, "updateGeometry", () => {
        if (this.disposed) return;
        const canvasRect = this.canvas.getBoundingClientRect();
        const parentRect = this.parent.getBoundingClientRect();
        const left = canvasRect.left - parentRect.left + this.parent.scrollLeft;
        const top = canvasRect.top - parentRect.top + this.parent.scrollTop;
        Object.assign(this.container.style, {
          left: `${left}px`,
          top: `${top}px`,
          width: `${canvasRect.width}px`,
          height: `${canvasRect.height}px`
        });
      });
      this.canvas = canvas;
      this.document = document;
      const parent = canvas.parentElement;
      if (!parent) throw new Error("TurboWarp renderer canvas has no parent element.");
      this.parent = parent;
      this.window = document.defaultView;
      this.container = document.createElement("div");
      this.container.dataset.turbowarpDiagnosticOverlay = "true";
      this.container.setAttribute("role", "alert");
      this.container.setAttribute("aria-live", "assertive");
      this.container.hidden = true;
      Object.assign(this.container.style, {
        position: "absolute",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: "2147483647"
      });
      const position = this.window?.getComputedStyle(parent).position ?? parent.style.position;
      if (!position || position === "static") {
        this.previousParentPosition = parent.style.position;
        parent.style.position = "relative";
        this.changedParentPosition = true;
      }
      parent.append(this.container);
      this.updateGeometry();
      this.window?.addEventListener("resize", this.updateGeometry);
      const ResizeObserverConstructor = this.window?.ResizeObserver;
      if (ResizeObserverConstructor) {
        const resizeObserver = new ResizeObserverConstructor(this.updateGeometry);
        this.resizeObserver = resizeObserver;
        resizeObserver.observe(canvas);
      }
    }
    showSvg(svg, accessibleText) {
      this.ensureActive();
      const Parser = this.window?.DOMParser ?? globalThis.DOMParser;
      if (!Parser) throw new Error("DOMParser is not available.");
      const parsed = new Parser().parseFromString(svg, "image/svg+xml");
      if (parsed.querySelector("parsererror") || parsed.documentElement.localName !== "svg") {
        throw new Error("Generated diagnostic SVG is invalid.");
      }
      const imported = this.document.importNode(
        parsed.documentElement,
        true
      );
      imported.style.width = "100%";
      imported.style.height = "100%";
      imported.style.display = "block";
      this.container.replaceChildren(imported);
      this.container.setAttribute("aria-label", accessibleText);
      this.updateGeometry();
      this.container.hidden = false;
    }
    clear() {
      if (this.disposed) return;
      this.container.hidden = true;
      this.container.removeAttribute("aria-label");
      this.container.replaceChildren();
    }
    isVisible() {
      return !this.disposed && !this.container.hidden;
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      this.window?.removeEventListener("resize", this.updateGeometry);
      this.container.remove();
      if (this.changedParentPosition && this.parent.style.position === "relative") {
        this.parent.style.position = this.previousParentPosition;
      }
    }
    ensureActive() {
      if (this.disposed) throw new Error("Diagnostic overlay host has been disposed.");
    }
  }
  function createDiagnosticOverlayComposition(scratch, options = {}) {
    const runtime = scratch.vm.runtime;
    const host = options.host ?? new BrowserStageOverlayHost(runtime.renderer.canvas);
    const controller = new DiagnosticOverlayController(host, {
      width: runtime.stageWidth ?? 480,
      height: runtime.stageHeight ?? 360,
      ...options.svg
    });
    const extension2 = new DiagnosticOverlayExtension(scratch, controller);
    return { extension: extension2, controller, host };
  }
  if (!Scratch.extensions.unsandboxed) {
    throw new Error(`${extensionConfig.name} must run unsandboxed.`);
  }
  const { extension } = createDiagnosticOverlayComposition(Scratch);
  Scratch.extensions.register(extension);

})(Scratch);
