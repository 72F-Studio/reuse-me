# Data Model

No implementation in this document. These are internal interfaces and responsibilities.

## Configuration

Responsibility: define how the analyzer should classify paths and emit warnings.

Fields:

```ts
interface AnalyzerConfig {
  sharedComponentDirs: string[];
  screenDirs: string[];
  ignore: string[];
  warningThreshold: number;
  strongWarningThreshold: number;
  includeLowConfidenceNotes: boolean;
}
```

Notes:

- Defaults should work without config.
- Config should only tune V1 behavior.
- No project-specific semantic annotations in V1.

## Diff File

Responsibility: represent a changed file from Git.

Fields:

```ts
interface DiffFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'unknown';
  isUiFile: boolean;
  hunks?: DiffHunk[];
}
```

## Diff Hunk

Responsibility: represent changed regions when available.

Fields:

```ts
interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  addedLines: string[];
  removedLines: string[];
}
```

## Component Inventory

Responsibility: repository-level collection of component metadata.

Fields:

```ts
interface ComponentInventory {
  components: ComponentMetadata[];
  importsByFile: Map<string, ImportMetadata[]>;
  importCountByComponent: Map<string, number>;
}
```

## Component Metadata

Responsibility: describe one component or component-like export.

Fields:

```ts
interface ComponentMetadata {
  id: string;
  name: string;
  filePath: string;
  exportKind: 'default' | 'named' | 'unknown';
  role: ComponentRole;
  importedBy: string[];
  imports: ImportMetadata[];
  jsxFingerprints: JsxFingerprint[];
  styleTokens: string[];
  props: string[];
  evidence: ComponentEvidence;
}
```

## Component Role

Responsibility: classify likely architectural role.

Values:

```ts
type ComponentRole = 'likely-shared' | 'likely-leaf' | 'unknown';
```

Role is heuristic and should not be treated as truth.

## Component Evidence

Responsibility: explain why a component was classified or ranked.

Fields:

```ts
interface ComponentEvidence {
  pathSignals: string[];
  usageSignals: string[];
  structureSignals: string[];
  negativeSignals: string[];
}
```

## Import Metadata

Responsibility: describe imports for usage and relationship scoring.

Fields:

```ts
interface ImportMetadata {
  sourceFile: string;
  moduleSpecifier: string;
  importedNames: string[];
  isRelative: boolean;
}
```

## JSX Fingerprint

Responsibility: compact structural representation of JSX.

Fields:

```ts
interface JsxFingerprint {
  rootName?: string;
  elementSequence: string[];
  componentSequence: string[];
  depth: number;
  childCount: number;
  normalizedShape: string;
}
```

Fingerprints should ignore text content and unstable formatting.

## Changed UI Signal

Responsibility: summarize UI-relevant changes in one changed file.

Fields:

```ts
interface ChangedUiSignal {
  filePath: string;
  role: ComponentRole;
  addedStyleTokens: string[];
  addedJsxFingerprints: JsxFingerprint[];
  repeatedTokenGroups: string[][];
  repeatedShapes: string[];
}
```

## Similarity Result

Responsibility: compare changed UI signals to one candidate shared component.

Fields:

```ts
interface SimilarityResult {
  candidateComponentId: string;
  changedFiles: string[];
  jsxOverlap: number;
  styleTokenOverlap: number;
  nameSimilarity: number;
  propSimilarity: number;
  usageProximity: number;
  totalSimilarity: number;
  evidence: string[];
}
```

All scores are normalized from 0 to 1.

## Candidate Ranking

Responsibility: ordered candidate source-of-truth components.

Fields:

```ts
interface CandidateRanking {
  candidates: RankedCandidate[];
  isAmbiguous: boolean;
}

interface RankedCandidate {
  component: ComponentMetadata;
  similarity: SimilarityResult;
  rankScore: number;
  evidence: string[];
  penalties: string[];
}
```

## Confidence Score

Responsibility: warning strength, not truth.

Fields:

```ts
interface ConfidenceScore {
  value: number;
  level: 'none' | 'low' | 'warning' | 'strong';
  contributors: ConfidenceContributor[];
  penalties: ConfidenceContributor[];
}

interface ConfidenceContributor {
  name: string;
  weight: number;
  explanation: string;
}
```

## Warning

Responsibility: actionable source-of-truth recommendation.

Fields:

```ts
interface SourceOfTruthWarning {
  id: string;
  changedFiles: string[];
  candidateComponent: {
    name: string;
    filePath: string;
  };
  confidence: ConfidenceScore;
  evidence: string[];
  recommendation: string;
  aiPrompt: string;
}
```

Warnings must be understandable without reading internal scores.

## Analysis Result

Responsibility: complete result returned by the pipeline.

Fields:

```ts
interface AnalysisResult {
  warnings: SourceOfTruthWarning[];
  skippedFiles: string[];
  summary: {
    changedUiFiles: number;
    indexedComponents: number;
    warnings: number;
  };
}
```

