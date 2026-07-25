import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type { RoleFact } from "../model/role";

// Derives shared/local role evidence from repository knowledge.
// This stage classifies roles only and emits no candidates or warnings.
export class RoleAnalyzer {
  analyze(knowledge: RepositoryKnowledge): RoleFact[] {
    const roles: RoleFact[] = [];

    for (const facts of knowledge.allFacts()) {
      const usage = knowledge.usageForPath(facts.path);
      const fileRole = fileRoleForPath(
        knowledge,
        facts.path,
        usage?.fileReferenceCount ?? 0
      );

      roles.push(fileRole);

      for (const declaration of facts.declarations) {
        if (declaration.name === undefined) {
          continue;
        }

        roles.push({
          scope: "declaration",
          path: facts.path,
          name: declaration.name,
          role: fileRole.role,
          reasons: fileRole.reasons
        });
      }
    }

    return roles.sort((a, b) =>
      `${a.path}:${a.name ?? ""}`.localeCompare(`${b.path}:${b.name ?? ""}`)
    );
  }
}

function fileRoleForPath(
  knowledge: RepositoryKnowledge,
  path: string,
  referenceCount: number
): RoleFact {
  const artifact = knowledge.artifactForPath(path);
  const hasSharedHint =
    artifact?.roleHints.some((hint) => hint.role === "shared") ?? false;
  const hasLocalHint =
    artifact?.roleHints.some((hint) => hint.role === "local") ?? false;
  const sharedReasons =
    artifact?.roleHints
      .filter((hint) => hint.role === "shared")
      .map((hint) => hint.reason) ?? [];
  const localReasons =
    artifact?.roleHints
      .filter((hint) => hint.role === "local")
      .map((hint) => hint.reason) ?? [];

  if (hasSharedHint && !hasLocalHint) {
    return {
      scope: "file",
      path,
      role: "shared",
      reasons: sharedReasons
    };
  }

  if (hasLocalHint && referenceCount < 2) {
    return {
      scope: "file",
      path,
      role: "local",
      reasons: localReasons
    };
  }

  if (referenceCount >= 2 && !hasLocalHint) {
    return {
      scope: "file",
      path,
      role: "shared",
      reasons: ["referenced by multiple files"]
    };
  }

  if (hasLocalHint && referenceCount >= 2) {
    return {
      scope: "file",
      path,
      role: "unknown",
      reasons: [...localReasons, "referenced by multiple files"]
    };
  }

  return {
    scope: "file",
    path,
    role: "unknown",
    reasons: []
  };
}
