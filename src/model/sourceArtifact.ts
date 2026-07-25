import type { Language } from "./language";

// Source file selected by an extractor for repository knowledge construction.
// Role hints are evidence emitted before reasoning, not final architectural truth.
export interface SourceArtifact {
  path: string;
  language: Language;
  extractorId: string;
  roleHints: SourceRoleHint[];
}

export interface SourceRoleHint {
  role: "shared" | "local" | "unknown";
  reason: string;
}

