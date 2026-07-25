import type { ChangedFacts } from "../model/changedFacts";
import type { ChangedFile } from "../model/diff";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type { SourceArtifact } from "../model/sourceArtifact";

// Projects changed UI files onto repository knowledge.
// This stage does not read Git or detect patterns.
export class ChangedFactsProjector {
  project(
    knowledge: RepositoryKnowledge,
    changedFiles: ChangedFile[],
    changedArtifacts: SourceArtifact[]
  ): ChangedFacts[] {
    const artifactsByPath = new Map(
      changedArtifacts.map((artifact) => [artifact.path, artifact])
    );

    return changedFiles
      .filter((changedFile) => artifactsByPath.has(changedFile.path))
      .map((changedFile) => ({
        path: changedFile.path,
        status: changedFile.status,
        artifact: artifactsByPath.get(changedFile.path),
        facts: knowledge.factsForPath(changedFile.path)
      }));
  }
}
