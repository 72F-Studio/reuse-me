import type { DesignToken } from "./designTokenSource";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type { UntokenizedValueFinding } from "../model/repositoryHealthFinding";

// How many files must repeat a raw value before it is worth naming.
const REPEAT_THRESHOLD = 3;

// Finds design values written as literals instead of referenced as tokens.
//
// Two cases, both language-independent because a colour or a dimension looks
// the same in Kotlin, Swift, Dart, CSS and TypeScript:
//
//   bypassed  the repository already declares a token with this exact value,
//             and the file wrote the literal anyway. Changing the token will
//             not change this file, which is precisely the failure that makes
//             a design system stop working.
//   candidate no token declares this value, but enough files repeat it that
//             it is behaving like one.
export class UntokenizedValueDetector {
  detect(
    knowledge: RepositoryKnowledge,
    tokens: DesignToken[]
  ): UntokenizedValueFinding[] {
    const tokenNamesByValue = new Map<string, string[]>();

    for (const token of tokens) {
      tokenNamesByValue.set(token.value, [
        ...(tokenNamesByValue.get(token.value) ?? []),
        token.name
      ]);
    }

    const tokenSourcePaths = new Set(tokens.map((token) => token.sourcePath));
    const pathsByValue = new Map<string, Set<string>>();

    for (const facts of knowledge.allFacts()) {
      // The file that declares the tokens is allowed to contain the literals.
      if (tokenSourcePaths.has(facts.path)) {
        continue;
      }

      for (const feature of facts.features) {
        if (feature.key !== "color" && feature.key !== "dimension") {
          continue;
        }

        pathsByValue.set(
          feature.value,
          (pathsByValue.get(feature.value) ?? new Set()).add(facts.path)
        );
      }
    }

    const findings: UntokenizedValueFinding[] = [];

    for (const [value, paths] of [...pathsByValue.entries()].sort()) {
      const tokenNames = tokenNamesByValue.get(value);
      const sourcePaths = [...paths].sort();

      if (tokenNames !== undefined) {
        findings.push({
          kind: "untokenized-value",
          reason: "bypassed",
          value,
          sourcePaths,
          tokenNames: [...new Set(tokenNames)].sort(),
          evidence: [
            `repository declares this value as ${[...new Set(tokenNames)].sort().join(", ")}`
          ]
        });

        continue;
      }

      if (sourcePaths.length >= REPEAT_THRESHOLD) {
        findings.push({
          kind: "untokenized-value",
          reason: "candidate",
          value,
          sourcePaths,
          tokenNames: [],
          evidence: [`repeated in ${sourcePaths.length} files with no token declaring it`]
        });
      }
    }

    return findings;
  }
}
