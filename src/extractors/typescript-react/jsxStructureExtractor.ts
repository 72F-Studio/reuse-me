import {
  forEachChild,
  isJsxElement,
  isJsxSelfClosingElement,
  type JsxTagNameExpression,
  type Node,
  type SourceFile
} from "typescript";

import type { FeatureFact } from "../../model/featureFact";
import type { RepositoryFacts } from "../../model/repositoryFacts";
import type { ParsedSource } from "./parsedSource";

// Enriches repository facts with JSX structure facts.
// This stage records syntax evidence only and makes no reuse recommendation.
export class JsxStructureExtractor {
  enrich(
    parsedSource: ParsedSource,
    repositoryFacts: RepositoryFacts
  ): RepositoryFacts {
    return {
      ...repositoryFacts,
      features: [
        ...repositoryFacts.features,
        ...(parsedSource.ast === null ? [] : extractJsxStructures(parsedSource.ast))
      ]
    };
  }
}

function extractJsxStructures(ast: SourceFile): FeatureFact[] {
  const facts: FeatureFact[] = [];

  visit(ast, (node) => {
    if (isJsxElement(node)) {
      facts.push(toFact(node.openingElement.tagName, ast));
    } else if (isJsxSelfClosingElement(node)) {
      facts.push(toFact(node.tagName, ast));
    }
  });

  return facts;
}

function visit(node: Node, onNode: (node: Node) => void): void {
  onNode(node);
  forEachChild(node, (child) => visit(child, onNode));
}

function toFact(tagName: JsxTagNameExpression, ast: SourceFile): FeatureFact {
  const elementName = tagName.getText(ast);

  return {
    category: "structure",
    key: /^[A-Z]/u.test(elementName) ? "component" : "intrinsic",
    value: elementName
  };
}
