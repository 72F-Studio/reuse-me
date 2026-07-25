#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../package.json";
import { GitChangedFileProvider } from "./git/diffReader";
import { JsonReporter } from "./reporter/jsonReporter";
import { MarkdownReporter } from "./reporter/markdownReporter";
import { TextReporter } from "./reporter/textReporter";
import { RepositoryHealthResultAssembler } from "./analysis/repositoryHealthResultAssembler";
import { ChangeAnalysisRunner } from "./runner/changeAnalysisRunner";
import { CheckRunner } from "./runner/checkRunner";
import { InventoryRunner } from "./runner/inventoryRunner";
import { KnowledgePipelineRunner } from "./runner/knowledgePipelineRunner";
import { RepositoryHealthRunner } from "./runner/repositoryHealthRunner";

// Exit codes are part of the interface. A pre-write hook needs to tell "the
// analyzer could not run" apart from "the analyzer ran and found drift",
// because only the second one should stop anybody's work.
const EXIT_FINDINGS = 2;
const EXIT_ERROR = 1;

const program = new Command();

program
  .name("component-intent-audit")
  .description(
    "Analyze repository knowledge and health using registered extractors."
  )
  .version(version)
  .option("--diff", "analyze the current diff")
  .option("--health", "analyze repository health without reading Git diff")
  .option(
    "--inventory",
    "list shared components and design tokens available for reuse"
  )
  .option(
    "--check <paths...>",
    "check specific files against the repository's existing abstractions"
  )
  .option("--json", "emit JSON output")
  .option("--markdown", "emit Markdown output")
  .action(
    (options: {
      health?: boolean;
      inventory?: boolean;
      check?: string[];
      json?: boolean;
      markdown?: boolean;
    }) => {
      try {
        const reporter =
          options.json === true
            ? new JsonReporter()
            : options.markdown === true
              ? new MarkdownReporter()
              : new TextReporter();
        const construction = new KnowledgePipelineRunner().construct(
          process.cwd()
        );

        if (construction.status === "limited") {
          console.log(
            reporter.render(
              new RepositoryHealthResultAssembler().assembleLimited(construction)
            )
          );
          return;
        }

        if (options.inventory === true) {
          console.log(
            reporter.render(new InventoryRunner().run(construction.knowledge))
          );
          return;
        }

        if (options.check !== undefined) {
          const result = new CheckRunner().run(
            construction.knowledge,
            toCheckedPaths(options.check, construction.knowledge.context.rootPath)
          );

          console.log(reporter.render(result));

          if (result.warnings.length > 0) {
            process.exitCode = EXIT_FINDINGS;
          }

          return;
        }

        console.log(
          reporter.render(
            options.health === true
              ? new RepositoryHealthRunner().run(construction.knowledge, {
                  capabilities: construction.capabilities,
                  repositoryStructure: construction.repositoryStructure
                })
              : new ChangeAnalysisRunner().run(
                  construction.knowledge,
                  new GitChangedFileProvider().getChangedFiles(
                    construction.knowledge.context
                  )
                )
          )
        );
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = EXIT_ERROR;
      }
    }
  );

// Paths arrive from a hook or a shell, so they may be absolute or relative to
// the working directory, while repository facts are keyed on repository-
// relative POSIX paths.
function toCheckedPaths(paths: string[], rootPath: string): string[] {
  const normalizedRoot = `${rootPath.replaceAll("\\", "/").replace(/\/$/u, "")}/`;

  return paths.map((path) => {
    const normalized = path.replaceAll("\\", "/");

    return normalized.startsWith(normalizedRoot)
      ? normalized.slice(normalizedRoot.length)
      : normalized;
  });
}

program.parse();
