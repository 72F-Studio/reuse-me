import { describe, expect, it } from "vitest";

import { defaultConfig } from "../../src/config/defaults";
import {
  GitChangedFileProvider,
  parseGitNameStatus
} from "../../src/git/diffReader";
import type { RepositoryContext } from "../../src/model/repository";

const repositoryContext: RepositoryContext = {
  rootPath: "/repo",
  config: defaultConfig
};

describe("parseGitNameStatus", () => {
  it("parses a modified file", () => {
    expect(parseGitNameStatus("M\tsrc/App.tsx\n")).toEqual([
      {
        path: "src/App.tsx",
        status: "modified"
      }
    ]);
  });

  it("parses a deleted file", () => {
    expect(parseGitNameStatus("D\tsrc/Old.tsx\n")).toEqual([
      {
        path: "src/Old.tsx",
        status: "deleted"
      }
    ]);
  });

  it("parses a renamed file", () => {
    expect(parseGitNameStatus("R100\tsrc/Old.tsx\tsrc/New.tsx\n")).toEqual([
      {
        path: "src/New.tsx",
        status: "renamed",
        previousPath: "src/Old.tsx"
      }
    ]);
  });

  it("returns an empty list for an empty diff", () => {
    expect(parseGitNameStatus("")).toEqual([]);
    expect(parseGitNameStatus("\n")).toEqual([]);
  });
});

describe("GitChangedFileProvider", () => {
  it("reads changed files from git for a repository context", () => {
    const provider = new GitChangedFileProvider((command, args, options) => {
      expect(command).toBe("git");
      expect(args).toEqual(["diff", "--name-status", "--find-renames"]);
      expect(options).toEqual({
        cwd: "/repo",
        encoding: "utf8"
      });

      return "A\tsrc/New.tsx\nM\tsrc/App.tsx\n";
    });

    expect(provider.getChangedFiles(repositoryContext)).toEqual([
      {
        path: "src/New.tsx",
        status: "added"
      },
      {
        path: "src/App.tsx",
        status: "modified"
      }
    ]);
  });
});
