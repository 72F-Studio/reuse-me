#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../package.json";
import { GitChangedFileProvider } from "./git/diffReader";
import { JsonReporter } from "./reporter/jsonReporter";
import { MarkdownReporter } from "./reporter/markdownReporter";
import { TextReporter } from "./reporter/textReporter";
import { RepositoryHealthResultAssembler } from "./analysis/repositoryHealthResultAssembler";
import { ChangeAnalysisRunner } from "./runner/changeAnalysisRunner";
import { KnowledgePipelineRunner } from "./runner/knowledgePipelineRunner";
import { RepositoryHealthRunner } from "./runner/repositoryHealthRunner";

const program = new Command();

program
  .name("component-intent-audit")
  .description(
    "Analyze repository knowledge and health using registered extractors."
  )
  .version(version)
  .option("--diff", "analyze the current diff")
  .option("--health", "analyze repository health without reading Git diff")
  .option("--json", "emit JSON output")
  .option("--markdown", "emit Markdown output")
  .action((options: { health?: boolean; json?: boolean; markdown?: boolean }) => {
    try {
      const reporter =
        options.json === true
          ? new JsonReporter()
          : options.markdown === true
            ? new MarkdownReporter()
            : new TextReporter();
      const construction = new KnowledgePipelineRunner().construct(process.cwd());
      const result =
        construction.status === "limited"
          ? new RepositoryHealthResultAssembler().assembleLimited(construction)
          : options.health === true
            ? new RepositoryHealthRunner().run(construction.knowledge, {
                capabilities: construction.capabilities,
                repositoryStructure: construction.repositoryStructure
              })
            : new ChangeAnalysisRunner().run(
                construction.knowledge,
                new GitChangedFileProvider().getChangedFiles(
                  construction.knowledge.context
                )
              );

      console.log(reporter.render(result));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program.parse();
