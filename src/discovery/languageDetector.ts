import { join, relative } from "node:path";

import { readDirSafe } from "../fs/safeReaddir";
import { versionedPaths } from "../fs/versionedPaths";
import type { Language } from "../model/language";
import type { RepositoryContext } from "../model/repository";

const LANGUAGE_BY_EXTENSION: Record<string, Language> = {
  ".kt": { id: "kotlin", name: "Kotlin" },
  ".kts": { id: "kotlin", name: "Kotlin" },
  ".java": { id: "java", name: "Java" },
  ".cs": { id: "csharp", name: "C#" },
  ".go": { id: "go", name: "Go" },
  ".rs": { id: "rust", name: "Rust" },
  ".py": { id: "python", name: "Python" },
  ".rb": { id: "ruby", name: "Ruby" },
  ".php": { id: "php", name: "PHP" },
  ".c": { id: "c", name: "C" },
  ".h": { id: "c", name: "C" },
  ".cc": { id: "cpp", name: "C++" },
  ".cpp": { id: "cpp", name: "C++" },
  ".cxx": { id: "cpp", name: "C++" },
  ".hpp": { id: "cpp", name: "C++" },
  ".scala": { id: "scala", name: "Scala" },
  ".tsx": { id: "typescript", name: "TypeScript" },
  ".ts": { id: "typescript", name: "TypeScript" },
  ".jsx": { id: "javascript", name: "JavaScript" },
  ".js": { id: "javascript", name: "JavaScript" },
  ".swift": { id: "swift", name: "Swift" },
  ".dart": { id: "dart", name: "Dart" },
  ".vue": { id: "vue", name: "Vue" }
};

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".gradle",
  ".idea",
  "build",
  "dist",
  "node_modules"
]);

// Detects repository languages for capability reporting only.
// This does not imply extractor support.
export class LanguageDetector {
  detect(context: RepositoryContext): Language[] {
    const languages = new Map<string, Language>();

    for (const path of walkFiles(context.rootPath, context.rootPath)) {
      const language = languageForPath(path);

      if (language !== undefined) {
        languages.set(language.id, language);
      }
    }

    return [...languages.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
}

function walkFiles(rootPath: string, directory: string): string[] {
  const files: string[] = [];
  const versioned = versionedPaths(rootPath);

  for (const entry of readDirSafe(directory)) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const absolutePath = join(directory, entry.name);
    const repositoryPath = relative(rootPath, absolutePath).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      if (versioned !== null && !versioned.hasDirectory(repositoryPath)) {
        continue;
      }

      files.push(...walkFiles(rootPath, absolutePath));
    } else if (
      entry.isFile() &&
      (versioned === null || versioned.hasFile(repositoryPath))
    ) {
      files.push(repositoryPath);
    }
  }

  return files;
}

export function languageForPath(path: string): Language | undefined {
  const extension = Object.keys(LANGUAGE_BY_EXTENSION).find((candidate) =>
    path.endsWith(candidate)
  );

  return extension === undefined ? undefined : LANGUAGE_BY_EXTENSION[extension];
}
