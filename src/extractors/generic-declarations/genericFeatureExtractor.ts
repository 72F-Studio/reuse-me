import type { FeatureFact } from "../../model/featureFact";

// Language-independent feature evidence.
//
// The drift analyses (missing abstraction, competing implementation,
// source-of-truth warnings) all consume FeatureFacts. Until now the only
// producer was the JSX/style pair, so those analyses were structurally dead in
// every repository that was not a React app: twenty-one languages got
// declarations and imports, one framework got the product.
//
// Component drift is a shape problem, not a syntax problem. These signals
// recover that shape from raw source without a per-language parser:
//
//   structure  constructed symbols — Compose `Column(`, SwiftUI `VStack {`,
//              Flutter `Container(`, Java `new Dialog(`. Capitalised
//              identifier applied to arguments or a trailing block is the
//              cross-language spelling of "builds a component".
//   style      colours and dimensions — `#3B82F6`, `0xFF3B82F6`, `16dp`,
//              `1.5rem`. Identical in Kotlin, Swift, Dart, CSS and TypeScript,
//              and precisely the values a design token should own.
//
// Both are deliberately shallow. They are review prompts, not proof.
const CONSTRUCTED_SYMBOL = /\b([A-Z][A-Za-z0-9_]*)\s*[({]/gu;
// Only the lengths CSS actually defines (RGB, RGBA, RRGGBB, RRGGBBAA), and
// never directly after an ampersand: `&#8600;` is an HTML entity, not a colour.
const HEX_COLOUR = /(?<!&)#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/gu;
const PACKED_COLOUR = /\b0[xX][0-9a-fA-F]{6,8}\b/gu;
// The optional inner dot covers Kotlin/Compose `8.dp`, where the unit is an
// extension property rather than a suffix. `1.5rem` still parses as a decimal.
const DIMENSION = /\b\d+(?:\.\d+)?\.?(?:dp|sp|px|rem|em|pt|vh|vw)\b/gu;
const CLASS_ATTRIBUTE = /\b(?:class|className)\s*[:=]\s*["'`]([^"'`]{1,300})["'`]/gu;

export function extractGenericFeatures(
  source: string,
  declaredNames: string[] = []
): FeatureFact[] {
  const features = new Map<string, FeatureFact>();
  // A file declaring `fun LoginScreen()` matches the constructed-symbol
  // pattern on its own name. Left in, every screen carried a unique feature
  // and no two files ever shared a shape, so no repeated pattern was ever
  // detected. What a file builds is evidence; what it is called is not.
  const declared = new Set(declaredNames);

  const add = (feature: FeatureFact): void => {
    features.set(`${feature.category}:${feature.key}:${feature.value}`, feature);
  };

  for (const [, symbol] of source.matchAll(CONSTRUCTED_SYMBOL)) {
    if (!declared.has(symbol)) {
      add({ category: "structure", key: "constructs", value: symbol });
    }
  }

  for (const [colour] of source.matchAll(HEX_COLOUR)) {
    add({ category: "style", key: "color", value: colour.toLowerCase() });
  }

  for (const [colour] of source.matchAll(PACKED_COLOUR)) {
    add({ category: "style", key: "color", value: colour.toLowerCase() });
  }

  for (const [dimension] of source.matchAll(DIMENSION)) {
    add({ category: "style", key: "dimension", value: dimension.toLowerCase() });
  }

  for (const [, classList] of source.matchAll(CLASS_ATTRIBUTE)) {
    for (const className of classList.split(/\s+/u)) {
      if (className !== "") {
        add({ category: "style", key: "className", value: className });
      }
    }
  }

  return [...features.values()];
}
