import { execFileSync } from "node:child_process";

import type { RepositoryContext } from "../model/repository";
import type { ChangedFile } from "../model/diff";

type CommandRunner = (
  command: string,
  args: string[],
  options: { cwd: string; encoding: "utf8" }
) => string;

// Provides changed files for later pipeline stages.
// This isolates all Git interaction behind a single interface.
export interface ChangedFileProvider {
  getChangedFiles(context: RepositoryContext): ChangedFile[];
}

// Reads changed files from Git using the repository context root.
export class GitChangedFileProvider implements ChangedFileProvider {
  constructor(private readonly runCommand: CommandRunner = execFileSync) {}

  getChangedFiles(context: RepositoryContext): ChangedFile[] {
    const output = this.runCommand(
      "git",
      ["diff", "--name-status", "--find-renames"],
      {
        cwd: context.rootPath,
        encoding: "utf8"
      }
    );

    return parseGitNameStatus(output);
  }
}

// Parses `git diff --name-status` output into domain change objects.
export function parseGitNameStatus(output: string): ChangedFile[] {
  const trimmed = output.trim();

  if (trimmed === "") {
    return [];
  }

  return trimmed
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map(parseGitNameStatusLine);
}

function parseGitNameStatusLine(line: string): ChangedFile {
  const parts = line.split("\t");
  const rawStatus = parts[0];

  if (rawStatus.startsWith("A") && parts.length >= 2) {
    return {
      path: parts[1],
      status: "added"
    };
  }

  if (rawStatus.startsWith("M") && parts.length >= 2) {
    return {
      path: parts[1],
      status: "modified"
    };
  }

  if (rawStatus.startsWith("D") && parts.length >= 2) {
    return {
      path: parts[1],
      status: "deleted"
    };
  }

  if (rawStatus.startsWith("R") && parts.length >= 3) {
    return {
      path: parts[2],
      status: "renamed",
      previousPath: parts[1]
    };
  }

  throw new Error(`Unsupported git diff status line: ${line}`);
}
