import {
  SyntaxKind,
  canHaveModifiers,
  forEachChild,
  getModifiers,
  isArrowFunction,
  isExportAssignment,
  isExportDeclaration,
  isExportSpecifier,
  isFunctionDeclaration,
  isFunctionExpression,
  isImportDeclaration,
  isNamedExports,
  isNamespaceImport,
  isVariableDeclaration,
  isVariableStatement,
  type ArrowFunction,
  type FunctionDeclaration,
  type FunctionExpression,
  type Node
} from "typescript";

import type { ParsedSource } from "./parsedSource";
import type {
  DeclarationFact,
  ExportFact,
  ImportFact,
  RepositoryFacts
} from "../../model/repositoryFacts";

// Builds canonical repository facts from a parsed source file.
// This stage extracts syntax-level import/export facts only.
export class RepositoryFactsBuilder {
  build(parsedSource: ParsedSource): RepositoryFacts {
    if (parsedSource.ast === null) {
      return {
        path: parsedSource.path,
        imports: [],
        exports: [],
        declarations: [],
        features: []
      };
    }

    return {
      path: parsedSource.path,
      imports: extractImportFacts(parsedSource),
      exports: extractExportFacts(parsedSource),
      declarations: extractDeclarationFacts(parsedSource),
      features: []
    };
  }
}

function extractImportFacts(parsedSource: ParsedSource): ImportFact[] {
  const importFacts: ImportFact[] = [];

  for (const statement of parsedSource.ast!.statements) {
    if (isExportDeclaration(statement) && statement.moduleSpecifier !== undefined) {
      const sourceModule = stripQuotes(
        statement.moduleSpecifier.getText(parsedSource.ast!)
      );

      if (statement.exportClause === undefined) {
        continue;
      }

      if (!isNamedExports(statement.exportClause)) {
        continue;
      }

      for (const element of statement.exportClause.elements) {
        if (!isExportSpecifier(element)) {
          continue;
        }

        importFacts.push({
          sourceModule,
          kind: "named",
          localName: element.name.text,
          importedName: (element.propertyName ?? element.name).text
        });
      }

      continue;
    }

    if (!isImportDeclaration(statement) || statement.importClause === undefined) {
      continue;
    }

    const sourceModule = statement.moduleSpecifier.getText(parsedSource.ast!);
    const normalizedSourceModule = stripQuotes(sourceModule);
    const importClause = statement.importClause;

    if (importClause.name !== undefined) {
      importFacts.push({
        sourceModule: normalizedSourceModule,
        kind: "default",
        localName: importClause.name.text
      });
    }

    const namedBindings = importClause.namedBindings;

    if (namedBindings === undefined) {
      continue;
    }

    if (isNamespaceImport(namedBindings)) {
      importFacts.push({
        sourceModule: normalizedSourceModule,
        kind: "namespace",
        localName: namedBindings.name.text
      });
      continue;
    }

    for (const element of namedBindings.elements) {
      importFacts.push({
        sourceModule: normalizedSourceModule,
        kind: "named",
        localName: element.name.text,
        importedName: (element.propertyName ?? element.name).text
      });
    }
  }

  return importFacts;
}

function extractExportFacts(parsedSource: ParsedSource): ExportFact[] {
  const exportFacts: ExportFact[] = [];

  for (const statement of parsedSource.ast!.statements) {
    if (isExportAssignment(statement)) {
      exportFacts.push({
        kind: "default",
        exportedName: "default",
        localName: getExpressionName(statement.expression)
      });
      continue;
    }

    if (
      isExportDeclaration(statement) &&
      statement.exportClause !== undefined &&
      isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        if (!isExportSpecifier(element)) {
          continue;
        }

        exportFacts.push({
          kind: "named",
          exportedName: element.name.text,
          localName: (element.propertyName ?? element.name).text
        });
      }

      continue;
    }

    const modifiers = getNodeModifiers(statement);

    if (!hasExportModifier(modifiers)) {
      continue;
    }

    if (isFunctionDeclaration(statement) && statement.name !== undefined) {
      exportFacts.push({
        kind: hasDefaultModifier(modifiers) ? "default" : "named",
        exportedName: hasDefaultModifier(modifiers)
          ? "default"
          : statement.name.text,
        localName: statement.name.text
      });
      continue;
    }

    if (isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.name.getText(parsedSource.ast!) === "") {
          continue;
        }

        const localName = declaration.name.getText(parsedSource.ast!);

        exportFacts.push({
          kind: hasDefaultModifier(modifiers) ? "default" : "named",
          exportedName: hasDefaultModifier(modifiers)
            ? "default"
            : localName,
          localName
        });
      }
    }
  }

  return exportFacts;
}

function extractDeclarationFacts(parsedSource: ParsedSource): DeclarationFact[] {
  const declarationFacts: DeclarationFact[] = [];

  for (const statement of parsedSource.ast!.statements) {
    if (isFunctionDeclaration(statement) && isComponentLikeFunction(statement)) {
      declarationFacts.push({
        kind: "declaration",
        name: statement.name?.text,
        visibility: getVisibility(getNodeModifiers(statement))
      });
      continue;
    }

    if (!isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!isVariableDeclaration(declaration)) {
        continue;
      }

      const nameText = declaration.name.getText(parsedSource.ast!);

      if (
        declaration.initializer !== undefined &&
        isPascalCaseName(nameText) &&
        isComponentLikeFunction(declaration.initializer)
      ) {
        declarationFacts.push({
          kind: "declaration",
          name: nameText,
          visibility: getVisibility(getNodeModifiers(statement))
        });
      }
    }
  }

  return declarationFacts;
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "");
}

function hasExportModifier(
  modifiers: readonly { kind: number }[] | undefined
): boolean {
  return modifiers?.some((modifier) => modifier.kind === 95) ?? false;
}

function hasDefaultModifier(
  modifiers: readonly { kind: number }[] | undefined
): boolean {
  return modifiers?.some((modifier) => modifier.kind === 90) ?? false;
}

function getVisibility(
  modifiers: readonly { kind: number }[] | undefined
): DeclarationFact["visibility"] {
  return hasExportModifier(modifiers) ? "exported" : "local";
}

function getNodeModifiers(node: Node): readonly { kind: number }[] | undefined {
  return canHaveModifiers(node) ? getModifiers(node) : undefined;
}

function getExpressionName(expression: { getText(): string }): string | undefined {
  const text = expression.getText().trim();

  return text === "" ? undefined : text;
}

function isPascalCaseName(name: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/u.test(name);
}

function isComponentLikeFunction(
  node: unknown
): node is FunctionDeclaration | FunctionExpression | ArrowFunction {
  if (typeof node !== "object" || node === null || !("kind" in node)) {
    return false;
  }

  const candidate = node as Node;

  if (
    !isFunctionDeclaration(candidate) &&
    !isFunctionExpression(candidate) &&
    !isArrowFunction(candidate)
  ) {
    return false;
  }

  if ("name" in candidate && candidate.name !== undefined) {
    const text = candidate.name.getText();

    if (text !== "" && !isPascalCaseName(text)) {
      return false;
    }
  }

  if (candidate.body === undefined) {
    return false;
  }

  if (
    candidate.body.kind === SyntaxKind.JsxElement ||
    candidate.body.kind === SyntaxKind.JsxSelfClosingElement ||
    candidate.body.kind === SyntaxKind.JsxFragment
  ) {
    return true;
  }

  let foundJsx = false;

  forEachChild(candidate.body, function visit(child) {
    if (
      child.kind === SyntaxKind.JsxElement ||
      child.kind === SyntaxKind.JsxSelfClosingElement ||
      child.kind === SyntaxKind.JsxFragment
    ) {
      foundJsx = true;
      return;
    }

    if (!foundJsx) {
      forEachChild(child, visit);
    }
  });

  return foundJsx;
}
