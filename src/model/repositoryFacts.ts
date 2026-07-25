import type { FeatureFact } from "./featureFact";

// Canonical container for facts extracted from one parsed source file.
// Extractors may enrich this with generic features, but the model stays
// framework-agnostic after repository knowledge construction.
export interface RepositoryFacts {
  path: string;
  imports: ImportFact[];
  exports: ExportFact[];
  declarations: DeclarationFact[];
  features: FeatureFact[];
}

// Represents one import observed in source code.
// Carries only syntax-level facts and no semantic interpretation.
export interface ImportFact {
  sourceModule: string;
  kind: "default" | "named" | "namespace";
  localName: string;
  importedName?: string;
}

// Represents one export observed in source code.
// Carries only syntax-level facts and no semantic interpretation.
export interface ExportFact {
  kind: "default" | "named";
  localName?: string;
  exportedName: string;
}

// Represents a declared program element discovered in source.
export interface DeclarationFact {
  kind: "declaration";
  name?: string;
  visibility: "exported" | "local";
}
