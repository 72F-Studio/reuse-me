import { join } from "node:path";
import { readFileSync } from "node:fs";

import { readDirSafe } from "../fs/safeReaddir";
import { versionedPaths, type VersionedPaths } from "../fs/versionedPaths";
import type { RepositoryContext } from "../model/repository";

// Where a repository declares its design tokens, and what it declares.
//
// Every ecosystem spells this differently and none of them need a parser: a
// token declaration is a name bound to a colour or a dimension, and the
// binding syntax across Tailwind config, Android colors.xml, CSS custom
// properties, SCSS variables, Compose theme files, Swift colour extensions and
// plain tokens.json is close enough that one set of patterns reads them all.
//
// This is the other half of the drift problem. Finding that three screens
// re-implement a button is worth less if the button's colour was hardcoded in
// all four places to begin with.

export interface DesignToken {
  name: string;
  value: string;
  sourcePath: string;
}

const TOKEN_FILE_PATTERNS = [
  /^tailwind\.config\.[cm]?[jt]s$/u,
  /^colors?\.xml$/u,
  /^dimens?\.xml$/u,
  /tokens?\.json$/u,
  /^(?:_)?variables\.(?:css|scss|sass|less)$/u,
  /^(?:theme|tokens|colors?|palette)\.(?:ts|js|kt|swift|dart|css|scss|json)$/u,
  /Theme\.kt$/u,
  /Colors?\.(?:kt|swift)$/u
];

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "vendor"
]);

// Matches a name bound to a colour or dimension, allowing for the wrapper the
// value usually arrives in:
//
//   name: "#3B82F6"          Tailwind, JSON, SCSS, CSS custom properties
//   val Brand = Color(0xFF…) Compose
//   let brand = Color(hex: "#3B82F6")  SwiftUI
//   --brand: #3B82F6         CSS
const NAMED_VALUE =
  /(?:--)?\$?([A-Za-z][\w.-]{1,60})\s*[:=]\s*(?:[A-Za-z_][\w.]*\s*\(\s*)?(?:[A-Za-z]\w*\s*:\s*)?["'`]?(#[0-9a-fA-F]{3,8}|0[xX][0-9a-fA-F]{6,8}|\d+(?:\.\d+)?\.?(?:dp|sp|px|rem|em|pt))\b/gu;
// <color name="brand_primary">#3B82F6</color>
const ANDROID_RESOURCE =
  /<(?:color|dimen)\s+name\s*=\s*"([^"]+)"\s*>\s*([^<\s]+)\s*<\//gu;

export function findDesignTokens(context: RepositoryContext): DesignToken[] {
  const tokens: DesignToken[] = [];

  for (const path of tokenFilePaths(context.rootPath, versionedPaths(context.rootPath))) {
    let source: string;

    try {
      source = readFileSync(join(context.rootPath, path), "utf8");
    } catch {
      continue;
    }

    for (const [, name, value] of source.matchAll(NAMED_VALUE)) {
      tokens.push({ name, value: value.toLowerCase(), sourcePath: path });
    }

    for (const [, name, value] of source.matchAll(ANDROID_RESOURCE)) {
      tokens.push({ name, value: value.toLowerCase(), sourcePath: path });
    }
  }

  return tokens;
}

function tokenFilePaths(
  rootPath: string,
  versioned: VersionedPaths | null
): string[] {
  const paths: string[] = [];

  function visit(directory: string, prefix: string): void {
    for (const entry of readDirSafe(directory)) {
      const repositoryPath = `${prefix}${entry.name}`;

      if (entry.isDirectory()) {
        if (
          !IGNORED_DIRECTORIES.has(entry.name) &&
          (versioned === null || versioned.hasDirectory(repositoryPath))
        ) {
          visit(join(directory, entry.name), `${repositoryPath}/`);
        }

        continue;
      }

      if (
        TOKEN_FILE_PATTERNS.some((pattern) => pattern.test(entry.name)) &&
        (versioned === null || versioned.hasFile(repositoryPath))
      ) {
        paths.push(repositoryPath);
      }
    }
  }

  visit(rootPath, "");

  return paths.sort();
}
