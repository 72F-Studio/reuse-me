import { readFileSync } from "node:fs";
import { basename, dirname, extname, join, normalize, relative } from "node:path";
import { dirname as posixDirname, join as posixJoin, normalize as posixNormalize } from "node:path/posix";

import { readDirSafe } from "../../fs/safeReaddir";
import { languageForPath } from "../../discovery/languageDetector";
import { roleHintsForPath } from "../../discovery/roleHints";
import { extractGenericFeatures } from "./genericFeatureExtractor";
import type {
  ExtractionResult,
  ExtractorDescriptor,
  ExtractorSupport,
  RepositoryExtractor
} from "../../model/extractor";
import type { Language } from "../../model/language";
import type { RelationshipFact } from "../../model/relationship";
import type { RepositoryContext } from "../../model/repository";
import type {
  DeclarationFact,
  ExportFact,
  ImportFact,
  RepositoryFacts
} from "../../model/repositoryFacts";
import type { SourceArtifact } from "../../model/sourceArtifact";

const LANGUAGES: Language[] = [
  { id: "c", name: "C" },
  { id: "cpp", name: "C++" },
  { id: "csharp", name: "C#" },
  { id: "dart", name: "Dart" },
  { id: "go", name: "Go" },
  { id: "java", name: "Java" },
  { id: "javascript", name: "JavaScript" },
  { id: "kotlin", name: "Kotlin" },
  { id: "php", name: "PHP" },
  { id: "python", name: "Python" },
  { id: "ruby", name: "Ruby" },
  { id: "rust", name: "Rust" },
  { id: "scala", name: "Scala" },
  { id: "swift", name: "Swift" },
  { id: "typescript", name: "TypeScript" },
  { id: "vue", name: "Vue" }
];

const DESCRIPTOR: ExtractorDescriptor = {
  id: "generic-declarations",
  name: "Generic Declaration Provider",
  languages: LANGUAGES,
  contributes: ["declaration-extraction"]
};

const IGNORED_DIRECTORIES = new Set([
  ".agents",
  ".codex",
  ".git",
  ".gradle",
  ".idea",
  ".kotlin",
  ".next",
  ".artifacts",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target"
]);

const MANIFEST_FILENAMES = new Set([
  "build.gradle",
  "build.gradle.kts",
  "package.json",
  "pom.xml",
  "pyproject.toml",
  "settings.gradle",
  "settings.gradle.kts"
]);

const SOURCE_EXTENSIONS = [
  ".c",
  ".cc",
  ".cpp",
  ".cs",
  ".cxx",
  ".dart",
  ".go",
  ".h",
  ".hpp",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".scala",
  ".swift",
  ".ts",
  ".tsx",
  ".vue"
];

interface ParsedFile {
  path: string;
  language: Language;
  packageName?: string;
  moduleName: string;
  facts: RepositoryFacts;
}

interface DeclarationWithLine {
  name: string;
  line: string;
}

// Generic Level 1 backend. It extracts syntax-level declarations/imports
// across common languages without claiming full language semantics.
export class GenericDeclarationsExtractor implements RepositoryExtractor {
  descriptor(): ExtractorDescriptor {
    return DESCRIPTOR;
  }

  detect(context: RepositoryContext): ExtractorSupport {
    const sourceFiles = discoverSourceFiles(context);
    const detectedLanguages = uniqueLanguages(sourceFiles);

    return {
      supported: sourceFiles.length > 0,
      detectedLanguages,
      reason:
        sourceFiles.length > 0
          ? undefined
          : "No supported source files found for generic declaration extraction."
    };
  }

  extract(context: RepositoryContext): ExtractionResult {
    const parsedFiles = discoverSourceFiles(context).map((path) =>
      parseFile(context, path)
    );

    return {
      artifacts: parsedFiles.map((file) => toArtifact(context, file)),
      facts: parsedFiles.map((file) => file.facts),
      relationships: analyzeRelationships(parsedFiles)
    };
  }
}

function discoverSourceFiles(context: RepositoryContext): string[] {
  const files: string[] = [];

  function visit(directory: string): void {
    for (const entry of readDirSafe(directory)) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const absolutePath = join(directory, entry.name);
      const repositoryPath = normalizePath(relative(context.rootPath, absolutePath));

      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile() && isSupportedSourcePath(repositoryPath, context)) {
        files.push(repositoryPath);
      }
    }
  }

  visit(context.rootPath);

  return files.sort();
}

function isSupportedSourcePath(
  path: string,
  context: RepositoryContext
): boolean {
  return (
    languageForPath(path) !== undefined &&
    !path.endsWith(".d.ts") &&
    !MANIFEST_FILENAMES.has(basename(path)) &&
    !isIgnored(path, context.config.ignore)
  );
}

function parseFile(context: RepositoryContext, path: string): ParsedFile {
  const language = languageForPath(path);

  if (language === undefined) {
    throw new Error(`Unsupported source file reached generic extractor: ${path}`);
  }

  const source = readFileSync(join(context.rootPath, path), "utf8");
  const stripped = stripComments(source, language.id);
  const packageName = packageNameFor(path, stripped, language.id);
  const declarations = extractDeclarations(stripped, language.id);
  const declarationFacts = declarations.map((declaration) => ({
    kind: "declaration" as const,
    name: declaration.name,
    visibility: visibilityFor(language.id, declaration)
  }));

  return {
    path,
    language,
    packageName,
    moduleName: moduleNameForPath(path),
    facts: {
      path,
      imports: extractImports(stripped, language.id),
      exports: declarationFacts
        .filter((declaration) => declaration.visibility === "exported")
        .map(toExportFact),
      declarations: declarationFacts,
      features: extractGenericFeatures(
        stripped,
        declarations.map((declaration) => declaration.name)
      )
    }
  };
}

function extractImports(source: string, languageId: string): ImportFact[] {
  switch (languageId) {
    case "python":
      return extractPythonImports(source);
    case "go":
      return extractGoImports(source);
    case "rust":
      return extractRustImports(source);
    case "dart":
      return extractDartImports(source);
    case "javascript":
    case "typescript":
      return extractJavaScriptImports(source);
    case "swift":
      return [...importsByRegex(source, /^\s*import\s+([A-Za-z_]\w*)/gmu)];
    case "c":
    case "cpp":
      return extractCIncludes(source);
    case "kotlin":
    case "java":
    case "scala":
      return extractDottedImports(source, /^\s*import\s+([A-Za-z_][\w.*]*)(?:\s+as\s+([A-Za-z_]\w*))?\s*;?/gmu);
    case "csharp":
      return extractDottedImports(source, /^\s*using\s+(?:static\s+)?([A-Za-z_][\w.]*)\s*;?/gmu);
    case "php":
      return extractDottedImports(source, /^\s*use\s+([A-Za-z_][\w\\]*)(?:\s+as\s+([A-Za-z_]\w*))?\s*;?/gmu, "\\");
    case "ruby":
      return importsByRegex(source, /^\s*require(?:_relative)?\s+["']([^"']+)["']/gmu);
    default:
      return [];
  }
}

function extractDeclarations(
  source: string,
  languageId: string
): DeclarationWithLine[] {
  const declarations = new Map<string, DeclarationWithLine>();

  for (const declaration of [
    ...classLikeDeclarations(source),
    ...functionLikeDeclarations(source, languageId),
    ...typeLikeDeclarations(source, languageId)
  ]) {
    declarations.set(declaration.name, declaration);
  }

  return [...declarations.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function classLikeDeclarations(source: string): DeclarationWithLine[] {
  return matches(
    source,
    /^\s*(?:public\s+|private\s+|internal\s+|protected\s+|open\s+|sealed\s+|data\s+|abstract\s+|final\s+|export\s+|pub\s+)*\b(?:class|interface|object|enum\s+class|enum|record|struct|protocol|trait|mixin|extension)\s+([A-Za-z_]\w*)/gmu
  );
}

function functionLikeDeclarations(
  source: string,
  languageId: string
): DeclarationWithLine[] {
  const patterns: RegExp[] = [
    /^\s*(?:public\s+|private\s+|internal\s+|protected\s+|open\s+|suspend\s+|override\s+|export\s+|pub\s+)*fun\s+([A-Za-z_]\w*)/gmu,
    /^\s*(?:public\s+|private\s+|internal\s+|protected\s+|static\s+|async\s+|export\s+|pub\s+)*func\s+(?:\([^)]+\)\s*)?([A-Za-z_]\w*)/gmu,
    /^\s*(?:pub\s+|async\s+|unsafe\s+|const\s+)*fn\s+([A-Za-z_]\w*)/gmu,
    /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)/gmu,
    /^\s*function\s+([A-Za-z_]\w*)/gmu,
    /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_]\w*)/gmu
  ];

  if (languageId === "java" || languageId === "csharp") {
    patterns.push(
      /^\s*(?:public|private|protected|internal|static|final|virtual|override|async|\s)+[A-Za-z_<>,[\]?]+\s+([A-Za-z_]\w*)\s*\(/gmu
    );
  }

  return patterns.flatMap((pattern) => matches(source, pattern));
}

function typeLikeDeclarations(
  source: string,
  languageId: string
): DeclarationWithLine[] {
  const declarations = [
    ...matches(source, /^\s*(?:pub\s+)?type\s+([A-Za-z_]\w*)/gmu),
    ...matches(source, /^\s*(?:public\s+|private\s+|internal\s+)?typealias\s+([A-Za-z_]\w*)/gmu),
    ...matches(source, /^\s*typedef\s+([A-Za-z_]\w*)/gmu)
  ];

  if (languageId === "go") {
    declarations.push(
      ...matches(source, /^\s*(?:var|const)\s+([A-Za-z_]\w*)/gmu)
    );
  }

  return declarations;
}

function analyzeRelationships(files: ParsedFile[]): RelationshipFact[] {
  const resolver = new GenericRelationshipResolver(files);
  const relationships: RelationshipFact[] = [];

  for (const file of files) {
    for (const importFact of file.facts.imports) {
      const resolved = resolver.resolve(file, importFact);

      relationships.push({
        importerPath: file.path,
        sourceModule: importFact.sourceModule,
        importKind: importFact.kind,
        localName: importFact.localName,
        importedName: importFact.importedName,
        ...resolved
      });
    }
  }

  return relationships.sort((a, b) =>
    `${a.importerPath}:${a.sourceModule}:${a.localName}`.localeCompare(
      `${b.importerPath}:${b.sourceModule}:${b.localName}`
    )
  );
}

class GenericRelationshipResolver {
  private readonly filesByPath = new Map<string, ParsedFile>();
  private readonly declarationsByQualifiedName = new Map<string, ParsedFile[]>();
  private readonly modulesByName = new Map<string, ParsedFile[]>();

  constructor(files: ParsedFile[]) {
    for (const file of files) {
      this.filesByPath.set(file.path, file);
      append(this.modulesByName, file.moduleName, file);

      if (file.packageName !== undefined) {
        append(this.modulesByName, file.packageName, file);
      }

      for (const declaration of file.facts.declarations) {
        if (declaration.name === undefined) {
          continue;
        }

        for (const name of qualifiedNamesFor(file, declaration.name)) {
          append(this.declarationsByQualifiedName, name, file);
        }
      }
    }
  }

  resolve(
    importer: ParsedFile,
    importFact: ImportFact
  ): Pick<
    RelationshipFact,
    "resolution" | "targetPath" | "targetExportName" | "targetDeclarationName"
  > {
    if (importFact.importedName === "*") {
      return { resolution: "unresolved" };
    }

    const pathTarget = this.resolvePathImport(importer, importFact.sourceModule);

    if (pathTarget !== undefined) {
      return this.toResolvedRelationship(pathTarget, importFact);
    }

    const declarationTargets = this.resolveDeclarationImport(importFact);

    if (declarationTargets.length === 1) {
      return this.toResolvedRelationship(declarationTargets[0], importFact);
    }

    if (declarationTargets.length > 1) {
      return { resolution: "ambiguous" };
    }

    const moduleTargets = this.modulesByName.get(importFact.sourceModule) ?? [];

    if (moduleTargets.length === 1) {
      return this.toResolvedRelationship(moduleTargets[0], importFact);
    }

    return {
      resolution: moduleTargets.length > 1 ? "ambiguous" : "unresolved"
    };
  }

  private resolvePathImport(
    importer: ParsedFile,
    sourceModule: string
  ): ParsedFile | undefined {
    if (!sourceModule.startsWith(".") && !sourceModule.startsWith("/")) {
      return undefined;
    }

    const basePath = sourceModule.startsWith("/")
      ? sourceModule.slice(1)
      : posixNormalize(posixJoin(posixDirname(importer.path), sourceModule));

    for (const candidate of candidatePathsForBase(basePath)) {
      const target = this.filesByPath.get(candidate);

      if (target !== undefined) {
        return target;
      }
    }

    return undefined;
  }

  private resolveDeclarationImport(importFact: ImportFact): ParsedFile[] {
    const candidates = [
      importFact.sourceModule,
      ...(importFact.importedName !== undefined
        ? [`${importFact.sourceModule}.${importFact.importedName}`]
        : [])
    ];

    return uniqueFiles(
      candidates.flatMap(
        (candidate) => this.declarationsByQualifiedName.get(candidate) ?? []
      )
    );
  }

  private toResolvedRelationship(
    target: ParsedFile,
    importFact: ImportFact
  ): Pick<
    RelationshipFact,
    "resolution" | "targetPath" | "targetExportName" | "targetDeclarationName"
  > {
    const targetName = targetDeclarationName(target, importFact);

    return {
      resolution: "resolved",
      targetPath: target.path,
      targetExportName: targetName,
      targetDeclarationName: targetName
    };
  }
}

function uniqueLanguages(paths: string[]): Language[] {
  const languages = new Map<string, Language>();

  for (const path of paths) {
    const language = languageForPath(path);

    if (language !== undefined) {
      languages.set(language.id, language);
    }
  }

  return [...languages.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function toArtifact(
  context: RepositoryContext,
  file: ParsedFile
): SourceArtifact {
  return {
    path: file.path,
    language: file.language,
    extractorId: DESCRIPTOR.id,
    roleHints: roleHintsForPath(context, file.path)
  };
}

function toExportFact(declaration: DeclarationFact): ExportFact {
  return {
    kind: "named",
    exportedName: declaration.name ?? "default",
    localName: declaration.name
  };
}

function visibilityFor(
  languageId: string,
  declaration: DeclarationWithLine
): DeclarationFact["visibility"] {
  if (/\b(private|internal)\b/u.test(declaration.line)) {
    return "local";
  }

  if (languageId === "go") {
    return /^[A-Z]/u.test(declaration.name) ? "exported" : "local";
  }

  if (languageId === "python" || languageId === "ruby") {
    return declaration.name.startsWith("_") ? "local" : "exported";
  }

  if (languageId === "rust") {
    return /\bpub\b/u.test(declaration.line) ? "exported" : "local";
  }

  return "exported";
}

function packageNameFor(
  path: string,
  source: string,
  languageId: string
): string | undefined {
  if (languageId === "python") {
    return moduleNameForPath(path);
  }

  if (languageId === "php") {
    return firstMatch(source, /^\s*namespace\s+([A-Za-z_][\w\\]*)\s*;/gmu)?.replaceAll("\\", ".");
  }

  if (languageId === "csharp") {
    return firstMatch(source, /^\s*namespace\s+([A-Za-z_][\w.]*)(?:\s*[;{])/gmu);
  }

  if (languageId === "go") {
    return firstMatch(source, /^\s*package\s+([A-Za-z_]\w*)/gmu);
  }

  if (
    languageId === "java" ||
    languageId === "kotlin" ||
    languageId === "scala"
  ) {
    return firstMatch(source, /^\s*package\s+([A-Za-z_][\w.]*)\s*;?/gmu);
  }

  return undefined;
}

function moduleNameForPath(path: string): string {
  return stripKnownSourcePrefix(path)
    .replace(/\.[^.]+$/u, "")
    .replace(/\/(?:index|mod|__init__)$/u, "")
    .replaceAll("/", ".");
}

function stripKnownSourcePrefix(path: string): string {
  return path.replace(
    /^(?:[^/]+\/)?src\/(?:main|test|androidTest|commonMain|commonTest)\/(?:java|kotlin|swift|dart|python|go|rust|js|ts)\//u,
    ""
  );
}

function qualifiedNamesFor(file: ParsedFile, name: string): string[] {
  return [
    name,
    `${file.moduleName}.${name}`,
    ...(file.packageName === undefined ? [] : [`${file.packageName}.${name}`])
  ];
}

function targetDeclarationName(
  target: ParsedFile,
  importFact: ImportFact
): string | undefined {
  const requestedName =
    importFact.importedName === undefined || importFact.importedName === "*"
      ? lastName(importFact.sourceModule)
      : importFact.importedName;

  if (
    target.facts.declarations.some(
      (declaration) => declaration.name === requestedName
    )
  ) {
    return requestedName;
  }

  if (target.facts.declarations.length === 1) {
    return target.facts.declarations[0].name;
  }

  return undefined;
}

function extractPythonImports(source: string): ImportFact[] {
  const imports: ImportFact[] = [];

  for (const match of source.matchAll(/^\s*from\s+([A-Za-z_.][\w.]*)\s+import\s+([^\n]+)/gmu)) {
    const sourceModule = match[1];

    for (const part of match[2].split(",")) {
      const [, importedName, alias] =
        part.trim().match(/^([A-Za-z_]\w*|\*)(?:\s+as\s+([A-Za-z_]\w*))?$/u) ??
        [];

      if (importedName !== undefined) {
        imports.push({
          sourceModule,
          kind: "named",
          localName: alias ?? importedName,
          importedName
        });
      }
    }
  }

  for (const match of source.matchAll(/^\s*import\s+([^\n]+)/gmu)) {
    for (const part of match[1].split(",")) {
      const [, sourceModule, alias] =
        part.trim().match(/^([A-Za-z_][\w.]*)(?:\s+as\s+([A-Za-z_]\w*))?$/u) ??
        [];

      if (sourceModule !== undefined) {
        imports.push({
          sourceModule,
          kind: "namespace",
          localName: alias ?? lastName(sourceModule)
        });
      }
    }
  }

  return imports;
}

function extractGoImports(source: string): ImportFact[] {
  const imports: ImportFact[] = [];
  const blockMatch = source.match(/^\s*import\s*\(([\s\S]*?)\)/mu);

  if (blockMatch !== null) {
    for (const line of blockMatch[1].split("\n")) {
      const importFact = parseGoImport(line);

      if (importFact !== undefined) {
        imports.push(importFact);
      }
    }
  }

  for (const match of source.matchAll(/^\s*import\s+([^\n]+)/gmu)) {
    const importFact = parseGoImport(match[1]);

    if (importFact !== undefined) {
      imports.push(importFact);
    }
  }

  return imports;
}

function parseGoImport(line: string): ImportFact | undefined {
  const [, alias, sourceModule] =
    line.trim().match(/^(?:(\w+)\s+)?["']([^"']+)["']/u) ?? [];

  if (sourceModule === undefined) {
    return undefined;
  }

  return {
    sourceModule,
    kind: "namespace",
    localName: alias ?? lastName(sourceModule)
  };
}

function extractRustImports(source: string): ImportFact[] {
  const imports: ImportFact[] = [];

  for (const match of source.matchAll(/^\s*use\s+([^;]+);/gmu)) {
    const sourceModule = match[1].trim().replaceAll("::", ".");

    if (sourceModule.includes("{")) {
      const [, prefix, names] =
        sourceModule.match(/^(.+)\.\{(.+)\}$/u) ?? [];

      if (prefix === undefined || names === undefined) {
        continue;
      }

      for (const name of names.split(",")) {
        const importedName = name.trim();

        if (importedName !== "") {
          imports.push({
            sourceModule: prefix,
            kind: "named",
            localName: importedName,
            importedName
          });
        }
      }
      continue;
    }

    imports.push({
      sourceModule,
      kind: "named",
      localName: lastName(sourceModule),
      importedName: lastName(sourceModule)
    });
  }

  return imports;
}

function extractDartImports(source: string): ImportFact[] {
  const imports: ImportFact[] = [];

  for (const match of source.matchAll(/^\s*import\s+["']([^"']+)["'](?:\s+as\s+([A-Za-z_]\w*))?/gmu)) {
    imports.push({
      sourceModule: match[1],
      kind: "namespace",
      localName: match[2] ?? basename(match[1], extname(match[1]))
    });
  }

  return imports;
}

function extractJavaScriptImports(source: string): ImportFact[] {
  const imports: ImportFact[] = [];

  for (const match of source.matchAll(/^\s*import\s+(.+?)\s+from\s+["']([^"']+)["']/gmu)) {
    const clause = match[1].trim();
    const sourceModule = match[2];

    if (/^[A-Za-z_$][\w$]*$/u.test(clause)) {
      imports.push({ sourceModule, kind: "default", localName: clause });
      continue;
    }

    const namedMatch = clause.match(/\{([^}]+)\}/u);

    if (namedMatch !== null) {
      for (const part of namedMatch[1].split(",")) {
        const [, importedName, alias] =
          part.trim().match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/u) ??
          [];

        if (importedName !== undefined) {
          imports.push({
            sourceModule,
            kind: "named",
            localName: alias ?? importedName,
            importedName
          });
        }
      }
    }
  }

  return imports;
}

function extractCIncludes(source: string): ImportFact[] {
  return [...source.matchAll(/^\s*#include\s+["<]([^">]+)[">]/gmu)].map(
    (match) => ({
      sourceModule: match[1],
      kind: "namespace",
      localName: basename(match[1], extname(match[1]))
    })
  );
}

function extractDottedImports(
  source: string,
  pattern: RegExp,
  separator = "."
): ImportFact[] {
  return [...source.matchAll(pattern)].map((match) => {
    const sourceModule = match[1].replaceAll(separator, ".");
    const importedName = lastName(sourceModule);

    return {
      sourceModule,
      kind: "named",
      localName: match[2] ?? importedName,
      importedName
    };
  });
}

function importsByRegex(source: string, pattern: RegExp): ImportFact[] {
  return [...source.matchAll(pattern)].map((match) => ({
    sourceModule: match[1],
    kind: "namespace",
    localName: lastName(match[1])
  }));
}

function matches(source: string, pattern: RegExp): DeclarationWithLine[] {
  return [...source.matchAll(pattern)]
    .map((match) => ({
      name: match[1],
      line: lineAt(source, match.index ?? 0)
    }))
    .filter((declaration) => declaration.name !== "if");
}

function lineAt(source: string, index: number): string {
  const start = source.lastIndexOf("\n", index) + 1;
  const end = source.indexOf("\n", index);

  return source.slice(start, end === -1 ? undefined : end);
}

function firstMatch(source: string, pattern: RegExp): string | undefined {
  return pattern.exec(source)?.[1];
}

function stripComments(source: string, languageId: string): string {
  if (languageId === "python" || languageId === "ruby") {
    return source.replace(/#.*$/gmu, "");
  }

  return source.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/\/\/.*$/gmu, "");
}

function candidatePathsForBase(basePath: string): string[] {
  return [
    basePath,
    ...SOURCE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => `${basePath}/index${extension}`),
    `${basePath}/__init__.py`,
    `${basePath}/mod.rs`
  ];
}

function uniqueFiles(files: ParsedFile[]): ParsedFile[] {
  return [...new Map(files.map((file) => [file.path, file])).values()];
}

function append<Key, Value>(
  map: Map<Key, Value[]>,
  key: Key,
  value: Value
): void {
  map.set(key, [...(map.get(key) ?? []), value]);
}

function isIgnored(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => globToRegExp(pattern).test(path));
}

function globToRegExp(pattern: string): RegExp {
  let escaped = "";

  for (let index = 0; index < pattern.length; index += 1) {
    if (pattern.startsWith("**/", index)) {
      escaped += "(?:.*/)?";
      index += 2;
    } else if (pattern.startsWith("**", index)) {
      escaped += ".*";
      index += 1;
    } else if (pattern[index] === "*") {
      escaped += "[^/]*";
    } else {
      escaped += escapeRegExp(pattern[index]);
    }
  }

  return new RegExp(`^${escaped}$`, "u");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.+^${}()|[\]\\]/gu, "\\$&");
}

function lastName(value: string): string {
  return value.split(/[./\\:]+/u).filter(Boolean).at(-1) ?? value;
}

function normalizePath(path: string): string {
  return normalize(path).replaceAll("\\", "/");
}
