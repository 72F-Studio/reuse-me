import type {
  DeclarationFact,
  ExportFact,
  ImportFact,
  RepositoryFacts
} from "./repositoryFacts";

// Declaration plus the file path where it was observed.
// This is index data only and does not interpret architectural intent.
export interface IndexedDeclaration {
  path: string;
  declaration: DeclarationFact;
}

// Export plus the file path where it was observed.
// This is index data only and does not resolve imports.
export interface IndexedExport {
  path: string;
  exportFact: ExportFact;
}

// Import plus the file path where it was observed.
// This is index data only and does not resolve dependencies.
export interface IndexedImport {
  path: string;
  importFact: ImportFact;
}

// Queryable derived index over repository facts.
// Preserves ambiguous matches by returning arrays instead of choosing winners.
export interface RepositoryFactsIndex {
  allFacts(): RepositoryFacts[];
  byPath(path: string): RepositoryFacts | undefined;
  declarationsByName(name: string): IndexedDeclaration[];
  exportsByName(name: string): IndexedExport[];
  importsBySource(sourceModule: string): IndexedImport[];
}
