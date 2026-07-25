import type { ObservedPattern } from "../model/observedPattern";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type { FeatureFact } from "../model/featureFact";
import type { RoleFact } from "../model/role";

// Detects repeated repository-wide local patterns independent of Git changes.
// This stage emits mode-neutral ObservedPattern objects and does not score candidates.
export class RepositoryPatternDetector {
  detect(knowledge: RepositoryKnowledge, roles: RoleFact[]): ObservedPattern[] {
    const localFacts = knowledge
      .allFacts()
      .filter((facts) => isLocalPath(facts.path, roles));

    if (localFacts.length < 2) {
      return [];
    }

    const repeatedFeatures = repeatedByName(
      localFacts.flatMap((facts) =>
        facts.features.filter((feature) => isPatternFeature(feature))
      ),
      featureIdentity
    );

    if (repeatedFeatures.length === 0) {
      return [];
    }

    return [
      {
        id: "repository-pattern-1",
        sourcePaths: localFacts.map((facts) => facts.path).sort(),
        features: repeatedFeatures,
        names: []
      }
    ];
  }
}

function isPatternFeature(feature: FeatureFact): boolean {
  return feature.category === "structure" || feature.category === "style";
}

function featureIdentity(feature: FeatureFact): string {
  return `${feature.category}:${feature.key}:${feature.value}`;
}

function isLocalPath(path: string, roles: RoleFact[]): boolean {
  return roles.some(
    (role) =>
      role.scope === "file" &&
      role.path === path &&
      role.role === "local"
  );
}

function repeatedByName<T>(
  values: T[],
  nameFor: (value: T) => string
): T[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const name = nameFor(value);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const seen = new Set<string>();
  const repeated: T[] = [];

  for (const value of values) {
    const name = nameFor(value);

    if ((counts.get(name) ?? 0) > 1 && !seen.has(name)) {
      seen.add(name);
      repeated.push(value);
    }
  }

  return repeated;
}
