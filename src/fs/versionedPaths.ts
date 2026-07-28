import { execFileSync } from "node:child_process";

// What Git would show: tracked files plus untracked ones that no .gitignore
// rule excludes.
//
// Every walker in the analyzer carried its own hardcoded list of directories
// to skip. That list can only ever name the conventions its author thought of,
// so anything else a repository deliberately ignores — a vendored checkout, a
// benchmark cache, generated output — was parsed anyway and reported as if it
// were first-party code. A repository already states what belongs to it, in
// .gitignore, and asking Git is both shorter and more accurate than guessing.
export interface VersionedPaths {
  hasFile(path: string): boolean;
  // Whether any versioned file lives under this directory. Walkers use it to
  // prune, so an ignored dependency tree is never descended into at all.
  hasDirectory(path: string): boolean;
}

const cache = new Map<string, VersionedPaths | null>();

// Returns null when the directory is not a Git repository, or Git is
// unavailable, in which case callers keep their own directory rules.
export function versionedPaths(rootPath: string): VersionedPaths | null {
  const cached = cache.get(rootPath);

  if (cached !== undefined) {
    return cached;
  }

  const resolved = readVersionedPaths(rootPath);
  cache.set(rootPath, resolved);

  return resolved;
}

function readVersionedPaths(rootPath: string): VersionedPaths | null {
  // Two questions, because Git will not answer both at once. Tracked files
  // come with --recurse-submodules, without which a submodule is one gitlink
  // entry and everything inside it disappears — and a submodule is exactly
  // where a shared design system tends to live. Untracked-but-not-ignored
  // files need --others, which refuses to recurse.
  const tracked =
    gitLsFiles(rootPath, ["--recurse-submodules"]) ??
    gitLsFiles(rootPath, ["--cached"]);

  if (tracked === null) {
    return null;
  }

  const files = new Set([
    ...tracked,
    ...(gitLsFiles(rootPath, ["--others", "--exclude-standard"]) ?? [])
  ]);
  const directories = new Set<string>();

  for (const path of files) {
    let separator = path.lastIndexOf("/");

    while (separator > 0) {
      directories.add(path.slice(0, separator));
      separator = path.lastIndexOf("/", separator - 1);
    }
  }

  return {
    hasFile: (path) => files.has(path),
    hasDirectory: (path) => directories.has(path)
  };
}

// Null rather than an empty list when Git cannot answer, so callers can tell
// "this repository has no such files" from "there is no repository here".
function gitLsFiles(rootPath: string, args: string[]): string[] | null {
  try {
    return execFileSync(
      "git",
      ["-C", rootPath, "ls-files", ...args, "-z"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 256 * 1024 * 1024
      }
    )
      .split("\0")
      .filter((path) => path !== "");
  } catch {
    return null;
  }
}
