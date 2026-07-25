import type { ChangedFacts } from "../model/changedFacts";
import type { FeatureFact } from "../model/featureFact";
import type { ObservedPattern } from "../model/observedPattern";
import type { RoleFact } from "../model/role";

// Detects repeated local implementation patterns in changed files.
// This stage produces shared ObservedPattern objects and does not score candidates.
export class ChangedPatternDetector {
  detect(changedFacts: ChangedFacts[], roles: RoleFact[]): ObservedPattern[] {
    const localChanges = changedFacts.filter(
      (changed) =>
        changed.facts !== undefined &&
        changed.status !== "deleted" &&
        isLocalPath(changed.path, roles)
    );

    if (localChanges.length < 2) {
      return [];
    }

    const repeatedFeatures = repeatedByName(
      localChanges.flatMap(
        (changed) =>
          changed.facts?.features.filter((feature) => isPatternFeature(feature)) ??
          []
      ),
      featureIdentity
    );

    if (repeatedFeatures.length === 0) {
      return [];
    }

    return [
      {
        id: "changed-pattern-1",
        sourcePaths: localChanges.map((changed) => changed.path).sort(),
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
