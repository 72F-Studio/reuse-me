import { readFileSync } from "node:fs";

import {
  ScriptKind,
  ScriptTarget,
  createSourceFile,
  sortAndDeduplicateDiagnostics,
  type Diagnostic
} from "typescript";

import type { ParsedSource, ParsedSourceError } from "./parsedSource";
import type { UiFile } from "./uiFile";

// Parses a UI file into a reusable intermediate representation.
// This stage performs no semantic analysis beyond AST creation and parse-error capture.
export class SourceFileParser {
  parse(uiFile: UiFile): ParsedSource {
    const sourceText = readFileSync(uiFile.path, "utf8");
    const ast = createSourceFile(
      uiFile.path,
      sourceText,
      ScriptTarget.Latest,
      true,
      getScriptKind(uiFile.path)
    );
    const diagnostics = sortAndDeduplicateDiagnostics(
      parseDiagnosticsFor(ast)
    ).map((diagnostic) =>
      typeof diagnostic.messageText === "string"
        ? diagnostic.messageText
        : flattenMessageText(diagnostic.messageText)
    );

    if (diagnostics.length > 0) {
      return {
        path: uiFile.path,
        sourceText,
        ast: null,
        parseError: buildParseError(diagnostics)
      };
    }

    return {
      path: uiFile.path,
      sourceText,
      ast,
      parseError: null
    };
  }
}

function parseDiagnosticsFor(sourceFile: unknown): Diagnostic[] {
  return [
    ...((sourceFile as { parseDiagnostics?: readonly Diagnostic[] })
      .parseDiagnostics ?? [])
  ];
}

function getScriptKind(path: string): ScriptKind {
  const lowerPath = path.toLowerCase();

  if (lowerPath.endsWith(".tsx") || lowerPath.endsWith(".native.tsx")) {
    return ScriptKind.TSX;
  }

  if (lowerPath.endsWith(".jsx") || lowerPath.endsWith(".native.jsx")) {
    return ScriptKind.JSX;
  }

  if (lowerPath.endsWith(".ts")) {
    return ScriptKind.TS;
  }

  if (lowerPath.endsWith(".js")) {
    return ScriptKind.JS;
  }

  return ScriptKind.Unknown;
}

function buildParseError(diagnostics: string[]): ParsedSourceError {
  return {
    message: diagnostics[0] ?? "Unknown parse error",
    diagnostics
  };
}

function flattenMessageText(
  messageText: string | { messageText: string; next?: typeof messageText[] }
): string {
  if (typeof messageText === "string") {
    return messageText;
  }

  const parts = [messageText.messageText];

  for (const next of messageText.next ?? []) {
    parts.push(flattenMessageText(next));
  }

  return parts.join(" ");
}
