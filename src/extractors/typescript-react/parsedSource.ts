import type { SourceFile } from "typescript";

// Represents the reusable source form consumed by later analysis stages.
// It preserves file identity, source text, and either a parsed AST or a parse error.
export interface ParsedSource {
  path: string;
  sourceText: string;
  ast: SourceFile | null;
  parseError: ParsedSourceError | null;
}

// Represents a parsing failure without crashing the pipeline.
// Diagnostics remain attached to the file so later stages can decide how to react.
export interface ParsedSourceError {
  message: string;
  diagnostics: string[];
}
