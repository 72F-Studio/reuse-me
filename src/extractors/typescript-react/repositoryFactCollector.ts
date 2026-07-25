import { join } from "node:path";

import type { RepositoryContext } from "../../model/repository";
import type { RepositoryFacts } from "../../model/repositoryFacts";
import type { SourceFileCandidate } from "./sourceFileCandidate";
import type { UiFile } from "./uiFile";
import { SourceFileParser } from "./sourceFileParser";
import { RepositoryFactsBuilder } from "./repositoryFactsBuilder";

// Collects repository facts for discovered source files.
// This stage only orchestrates parsing and existing fact extraction.
export class RepositoryFactCollector {
  constructor(
    private readonly parser = new SourceFileParser(),
    private readonly factsBuilder = new RepositoryFactsBuilder()
  ) {}

  collect(
    context: RepositoryContext,
    candidates: SourceFileCandidate[]
  ): RepositoryFacts[] {
    return candidates.map((candidate) => {
      const parsedSource = this.parser.parse(toUiFile(context, candidate));

      return this.factsBuilder.build({
        ...parsedSource,
        path: candidate.path
      });
    });
  }
}

function toUiFile(
  context: RepositoryContext,
  candidate: SourceFileCandidate
): UiFile {
  return {
    path: join(context.rootPath, candidate.path),
    framework: "unknown",
    kind: "unknown"
  };
}
