// Generic observable feature extracted from source.
// Framework-specific syntax is normalized by extractors before reasoning sees it.
export interface FeatureFact {
  category: "structure" | "style" | "name" | "other";
  key: string;
  value: string;
}

