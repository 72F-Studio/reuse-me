// Defines runtime configuration for the analyzer.
// Values here only tune V1 behavior; they do not add repository semantics.
export interface AnalyzerConfig {
  sharedSourceDirs: string[];
  localSourceDirs: string[];
  ignore: string[];
  warningThreshold: number;
  strongWarningThreshold: number;
  includeLowConfidenceNotes: boolean;
}
