import type { RepositoryContext } from "../model/repository";
import type { SourceArtifact } from "../model/sourceArtifact";

// Directory evidence for a file's architectural role, in any language.
//
// The configured `sharedSourceDirs` / `localSourceDirs` are matched as path
// prefixes and stay authoritative, but their defaults describe one ecosystem's
// layout: `src/components`, `src/screens`. A Kotlin project puts components in
// `ui/components`, Flutter in `lib/widgets`, SwiftUI in
// `Sources/DesignSystem`, Next.js in a top-level `components`. None of those
// matched, so those repositories produced no roles, therefore no patterns, and
// therefore no findings at all.
//
// Directory *names* are matched wherever they appear. The segment nearest the
// file wins, so `ui/screens/LoginScreen.kt` reads as local even though `ui`
// also appears in the shared vocabulary.
export function roleHintsForPath(
  context: RepositoryContext,
  path: string
): SourceArtifact["roleHints"] {
  const normalizedPath = normalizePath(path);

  for (const directory of context.config.sharedSourceDirs) {
    if (normalizedPath.startsWith(`${normalizePath(directory)}/`)) {
      return [{ role: "shared", reason: "shared source directory" }];
    }
  }

  for (const directory of context.config.localSourceDirs) {
    if (normalizedPath.startsWith(`${normalizePath(directory)}/`)) {
      return [{ role: "local", reason: "local source directory" }];
    }
  }

  return hintsFromDirectoryNames(context, normalizedPath);
}

function hintsFromDirectoryNames(
  context: RepositoryContext,
  normalizedPath: string
): SourceArtifact["roleHints"] {
  const shared = new Set(
    context.config.sharedDirNames.map((name) => name.toLowerCase())
  );
  const local = new Set(
    context.config.localDirNames.map((name) => name.toLowerCase())
  );
  // Drop the filename, then walk back towards the repository root so the
  // directory closest to the file decides.
  const segments = normalizedPath.split("/").slice(0, -1).reverse();

  for (const segment of segments) {
    const name = segment.toLowerCase();

    if (shared.has(name)) {
      return [{ role: "shared", reason: `shared directory name "${segment}"` }];
    }

    if (local.has(name)) {
      return [{ role: "local", reason: `local directory name "${segment}"` }];
    }
  }

  return [];
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}
