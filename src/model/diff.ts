// Represents one changed file discovered from Git.
// This is the only change model exposed to later pipeline stages in V1.
export interface ChangedFile {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  previousPath?: string;
}
