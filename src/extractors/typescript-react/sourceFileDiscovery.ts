import { existsSync } from "node:fs";
import { join, relative } from "node:path";

import { readDirSafe } from "../../fs/safeReaddir";
import type { RepositoryContext } from "../../model/repository";
import type { SourceFileCandidate } from "./sourceFileCandidate";

const SUPPORTED_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js"] as const;

// Discovers repository source files from configured UI directories.
// This stage does not read file contents or classify components.
export class SourceFileDiscovery {
  discover(context: RepositoryContext): SourceFileCandidate[] {
    const candidates = new Map<string, SourceFileCandidate>();

    for (const directory of context.config.sharedSourceDirs) {
      this.addDirectoryCandidates(
        candidates,
        context,
        directory,
        "sharedSourceDir"
      );
    }

    for (const directory of context.config.localSourceDirs) {
      this.addDirectoryCandidates(candidates, context, directory, "localSourceDir");
    }

    return [...candidates.values()].sort((a, b) => a.path.localeCompare(b.path));
  }

  private addDirectoryCandidates(
    candidates: Map<string, SourceFileCandidate>,
    context: RepositoryContext,
    configuredDirectory: string,
    discoveredFrom: SourceFileCandidate["discoveredFrom"]
  ): void {
    const absoluteDirectory = join(context.rootPath, configuredDirectory);

    if (!existsSync(absoluteDirectory)) {
      return;
    }

    for (const absolutePath of walkFiles(absoluteDirectory)) {
      const repositoryPath = normalizePath(relative(context.rootPath, absolutePath));

      if (
        isSupportedSourceFile(repositoryPath) &&
        !isIgnored(repositoryPath, context.config.ignore)
      ) {
        candidates.set(repositoryPath, {
          path: repositoryPath,
          discoveredFrom
        });
      }
    }
  }
}

function walkFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readDirSafe(directory)) {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function isSupportedSourceFile(path: string): boolean {
  return SUPPORTED_EXTENSIONS.some((extension) => path.endsWith(extension));
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

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}
