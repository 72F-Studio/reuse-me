// Defines runtime configuration for the analyzer.
// Values here only tune V1 behavior; they do not add repository semantics.
export interface AnalyzerConfig {
  sharedSourceDirs: string[];
  localSourceDirs: string[];
  // Directory *names* that signal a role wherever they appear in a path.
  // Path prefixes above are a JavaScript web convention; a Kotlin project
  // keeps components in `ui/components`, a Flutter one in `lib/widgets`, a
  // SwiftUI one in `Sources/DesignSystem`. Matching on the segment nearest the
  // file makes the heuristic work in any language's layout.
  sharedDirNames: string[];
  localDirNames: string[];
  ignore: string[];
  warningThreshold: number;
  strongWarningThreshold: number;
  includeLowConfidenceNotes: boolean;
}
