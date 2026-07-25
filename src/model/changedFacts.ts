import type { ChangedFile } from "./diff";
import type { RepositoryFacts } from "./repositoryFacts";
import type { SourceArtifact } from "./sourceArtifact";

// Repository knowledge projected onto one changed UI file.
// Git state stays here and does not become repository knowledge.
export interface ChangedFacts {
  path: string;
  status: ChangedFile["status"];
  artifact?: SourceArtifact;
  facts?: RepositoryFacts;
}
