import type {
  RepositoryKnowledge,
  RepositoryKnowledgeInput
} from "../model/repositoryKnowledge";

// Assembles the public repository knowledge query boundary.
// This stage packages existing construction outputs and derives no new facts.
export class RepositoryKnowledgeAssembler {
  assemble(input: RepositoryKnowledgeInput): RepositoryKnowledge {
    const sourceArtifacts = input.sourceArtifacts;
    const artifactsByPath = new Map(
      sourceArtifacts.map((artifact) => [artifact.path, artifact])
    );

    return {
      context: input.context,
      sourceArtifacts: () => sourceArtifacts,
      sourceFiles: () => sourceArtifacts,
      files: () => sourceArtifacts,
      artifactForPath: (path) => artifactsByPath.get(path),
      factsForPath: (path) => input.factsIndex.byPath(path),
      allFacts: () => input.factsIndex.allFacts(),
      declarationsByName: (name) => input.factsIndex.declarationsByName(name),
      exportsByName: (name) => input.factsIndex.exportsByName(name),
      importsBySource: (sourceModule) =>
        input.factsIndex.importsBySource(sourceModule),
      relationships: () => input.relationships,
      relationshipsForPath: (path) =>
        input.relationships.filter(
          (relationship) =>
            relationship.importerPath === path || relationship.targetPath === path
        ),
      usage: () => input.usage,
      usageForPath: (path) =>
        input.usage.find((usageFact) => usageFact.path === path)
    };
  }
}
