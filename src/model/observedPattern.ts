import type { FeatureFact } from "./featureFact";

// Mode-neutral pattern observed in changed files or repository-wide analysis.
// Similarity/ranking stages consume this shape without knowing its origin mode.
export interface ObservedPattern {
  id: string;
  sourcePaths: string[];
  features: FeatureFact[];
  names: string[];
}
