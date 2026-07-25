import type { ObservedPattern } from "../model/observedPattern";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type { FeatureFact } from "../model/featureFact";
import type { RepositoryFacts } from "../model/repositoryFacts";
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

    return groupByFeatureSignature(localFacts);
  }
}

// Groups local files that share a feature signature into separate patterns.
//
// A single merged pattern per repository was actively harmful. Every repeated
// feature anywhere in the codebase landed in one bag, so the pattern's feature
// set grew with repository size while any individual abstraction matched only
// a small part of it. Because similarity is a Jaccard overlap, the union in
// the denominator drove the score down as the repository got bigger: the more
// duplication a codebase contained, the less likely the tool was to report it.
//
// Files now group by the set of structure features they share, so a pattern
// describes one repeated shape and its score reflects that shape alone.
function groupByFeatureSignature(
  localFacts: RepositoryFacts[]
): ObservedPattern[] {
  const groups = new Map<string, RepositoryFacts[]>();

  for (const facts of localFacts) {
    const signature = structureSignature(facts);

    if (signature === "") {
      continue;
    }

    groups.set(signature, [...(groups.get(signature) ?? []), facts]);
  }

  const patterns: ObservedPattern[] = [];

  for (const [signature, members] of [...groups.entries()].sort()) {
    if (members.length < 2) {
      continue;
    }

    const repeatedFeatures = repeatedByName(
      members.flatMap((facts) =>
        facts.features.filter((feature) => isPatternFeature(feature))
      ),
      featureIdentity
    );

    if (repeatedFeatures.length === 0) {
      continue;
    }

    patterns.push({
      id: `repository-pattern-${patterns.length + 1}`,
      sourcePaths: members.map((facts) => facts.path).sort(),
      features: repeatedFeatures,
      // Declaration names of the files taking part in the pattern. This was
      // hardcoded to an empty array, which silently zeroed the name-overlap
      // term in every similarity score computed in health mode.
      names: declarationNames(members, signature)
    });
  }

  return patterns;
}

function structureSignature(facts: RepositoryFacts): string {
  return [
    ...new Set(
      facts.features
        .filter((feature) => feature.category === "structure")
        .map((feature) => `${feature.key}:${feature.value}`)
    )
  ]
    .sort()
    .join("|");
}

function declarationNames(
  members: RepositoryFacts[],
  signature: string
): string[] {
  const names = new Set<string>();

  for (const facts of members) {
    for (const declaration of facts.declarations) {
      if (declaration.name !== undefined) {
        names.add(declaration.name);
      }
    }
  }

  // The structural vocabulary of the pattern counts as a name too: local code
  // that constructs a `Button` is evidence about a shared `Button`, even when
  // the surrounding function is called `LoginScreen`.
  for (const entry of signature.split("|")) {
    const value = entry.split(":")[1];

    if (value !== undefined && value !== "") {
      names.add(value);
    }
  }

  return [...names].sort();
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
