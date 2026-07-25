import { join, relative } from "node:path";

import { readDirSafe } from "../../fs/safeReaddir";
import { roleHintsForPath } from "../../discovery/roleHints";
import type { RepositoryContext } from "../../model/repository";
import type { SourceFileCandidate } from "./sourceFileCandidate";

const SUPPORTED_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js"] as const;

// Discovers repository source files from configured UI directories.
// This stage does not read file contents or classify components.
export class SourceFileDiscovery {
  // Walks the whole repository and keeps the files that carry a role hint.
  //
  // Discovery used to visit only the configured `sharedSourceDirs` and
  // `localSourceDirs`, whose defaults are `src/components` and `src/screens`.
  // A Next.js App Router project keeps components in a top-level `components/`
  // and a Vite project in `src/ui`; neither matched, so the React provider
  // reported itself unsupported and the repository silently lost all JSX and
  // style intelligence. Role hints already know every convention, so discovery
  // asks them rather than repeating a directory list.
  discover(context: RepositoryContext): SourceFileCandidate[] {
    const candidates: SourceFileCandidate[] = [];

    for (const absolutePath of walkFiles(context.rootPath)) {
      const repositoryPath = normalizePath(
        relative(context.rootPath, absolutePath)
      );

      if (
        !isSupportedSourceFile(repositoryPath) ||
        isIgnored(repositoryPath, context.config.ignore)
      ) {
        continue;
      }

      const role = roleHintsForPath(context, repositoryPath)[0]?.role;

      if (role === "shared" || role === "local") {
        candidates.push({
          path: repositoryPath,
          discoveredFrom:
            role === "shared" ? "sharedSourceDir" : "localSourceDir"
        });
      }
    }

    return candidates.sort((a, b) => a.path.localeCompare(b.path));
  }
}

// Directories that never contain first-party source. Discovery now starts at
// the repository root, so skipping these is what keeps it from walking into
// dependency trees and build output.
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".svelte-kit",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "vendor"
]);

function walkFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readDirSafe(directory)) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

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
