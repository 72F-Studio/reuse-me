// Usage counts for one repository file.
// Descriptive only: no shared/local role or recommendation is implied.
export interface UsageFact {
  path: string;
  fileReferenceCount: number;
  declarationReferences: DeclarationUsageFact[];
}

// Reference count for one declaration within a file.
// Populated when relationships identify a target declaration.
export interface DeclarationUsageFact {
  name: string;
  referenceCount: number;
}
