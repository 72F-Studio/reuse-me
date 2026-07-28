import type { ImportFact } from "./repositoryFacts";

// Represents an observed relationship between one file and another, resolved
// against repository facts. Evidence only: it does not imply reuse or
// architectural intent.
export interface RelationshipFact {
  importerPath: string;
  sourceModule: string;
  importKind: ImportFact["kind"];
  localName: string;
  importedName?: string;
  // "external" is not a failure. An import of `androidx.compose.material3` or
  // `react` names something outside the repository and was never going to
  // resolve against it. Counting those as unresolved made the import graph
  // look broken in every language whose framework imports are explicit, and
  // the coverage report then withheld conclusions it had the evidence for.
  resolution: "resolved" | "unresolved" | "ambiguous" | "external";
  targetPath?: string;
  targetExportName?: string;
  targetDeclarationName?: string;
  // How the relationship was observed. Import statements are one way and the
  // only way in JavaScript, Python and Ruby. Kotlin, Java, C#, Go, Scala and
  // Swift let a file use a sibling in the same package or module with no
  // import at all, so an import-only graph reports those repositories as
  // having almost no internal references — a conclusion about the analyzer,
  // not about the code.
  origin?: "import" | "same-scope";
}
