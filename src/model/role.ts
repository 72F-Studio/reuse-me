// Role inferred for a repository file or declaration.
// This is evidence for later reasoning, not a warning or recommendation.
export interface RoleFact {
  scope: "file" | "declaration";
  path: string;
  name?: string;
  role: "shared" | "local" | "unknown";
  reasons: string[];
}
