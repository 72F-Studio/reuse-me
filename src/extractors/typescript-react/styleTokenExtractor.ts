import {
  forEachChild,
  isJsxAttribute,
  isJsxExpression,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteral,
  type JsxAttribute,
  type Node,
  type SourceFile
} from "typescript";

import type { FeatureFact } from "../../model/featureFact";
import type { RepositoryFacts } from "../../model/repositoryFacts";
import type { ParsedSource } from "./parsedSource";

// Enriches repository facts with statically observable style tokens.
// Dynamic expressions are skipped instead of guessed.
export class StyleTokenExtractor {
  enrich(
    parsedSource: ParsedSource,
    repositoryFacts: RepositoryFacts
  ): RepositoryFacts {
    return {
      ...repositoryFacts,
      features: [
        ...repositoryFacts.features,
        ...(parsedSource.ast === null ? [] : extractStyleTokens(parsedSource.ast))
      ]
    };
  }
}

function extractStyleTokens(ast: SourceFile): FeatureFact[] {
  const tokens: FeatureFact[] = [];

  visit(ast, (node) => {
    if (isJsxAttribute(node)) {
      tokens.push(...tokensFromAttribute(node));
    }
  });

  return tokens;
}

function visit(node: Node, onNode: (node: Node) => void): void {
  onNode(node);
  forEachChild(node, (child) => visit(child, onNode));
}

function tokensFromAttribute(attribute: JsxAttribute): FeatureFact[] {
  const name = attribute.name.getText();
  const initializer = attribute.initializer;

  if (name === "className" && initializer !== undefined && isStringLiteral(initializer)) {
    return initializer.text
      .split(/\s+/u)
      .filter((token) => token !== "")
      .map((value) => ({ category: "style", key: "className", value }));
  }

  if (
    name !== "style" ||
    initializer === undefined ||
    !isJsxExpression(initializer)
  ) {
    return [];
  }

  const expression = initializer.expression;

  if (expression === undefined || !isObjectLiteralExpression(expression)) {
    return [];
  }

  return expression.properties
    .filter(isPropertyAssignment)
    .map((property) => property.name.getText())
    .map((value) => ({ category: "style", key: "styleKey", value }));
}
