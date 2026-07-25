import type { ImportFact } from "./repositoryFacts";

// Represents an observed import relationship resolved against repository facts.
// It is evidence only and does not imply reuse or architectural intent.
export interface RelationshipFact {
  importerPath: string;
  sourceModule: string;
  importKind: ImportFact["kind"];
  localName: string;
  importedName?: string;
  resolution: "resolved" | "unresolved" | "ambiguous";
  targetPath?: string;
  targetExportName?: string;
  targetDeclarationName?: string;
}
